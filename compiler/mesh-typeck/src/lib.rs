//! Mesh type checker: Hindley-Milner type inference with extensions.
//!
//! This crate implements type checking and inference for the Mesh language.
//! It builds on the parser's CST/AST to assign types to all expressions,
//! detect type errors, and support features like:
//!
//! - Hindley-Milner type inference with let-polymorphism
//! - Unification with occurs check
//! - Type annotations (explicit and inferred)
//! - Generic functions and data types
//! - Option/Result sugar types
//!
//! # Architecture
//!
//! - [`ty`]: Core type representation (Ty, TyCon, TyVar, Scheme)
//! - [`unify`]: Unification engine with occurs check and level-based generalization
//! - [`env`]: Type environment with scope stack
//! - [`builtins`]: Built-in type and operator registration
//! - [`error`]: Type error types with provenance tracking
//! - [`infer`]: Algorithm J inference engine

pub mod builtins;
pub mod diagnostics;
pub mod env;
pub mod error;
pub mod exhaustiveness;
pub mod infer;
pub mod traits;
pub mod ty;
pub mod unify;

use rustc_hash::{FxHashMap, FxHashSet};
use rowan::TextRange;

use crate::diagnostics::DiagnosticOptions;
use crate::error::TypeError;
use crate::traits::{TraitDef, ImplDef as TraitImplDef};
use crate::ty::{Scheme, Ty};

// Re-export type registry types for downstream crate consumption (codegen).
pub use crate::infer::{
    StructDefInfo, SumTypeDefInfo, TypeAliasInfo, TypeRegistry, VariantFieldInfo, VariantInfo,
    register_variant_constructors,
};
// Re-export trait registry for downstream trait resolution (codegen dispatch).
pub use crate::traits::TraitRegistry;

// ── Cross-Module Type Checking Types ────────────────────────────────────

/// Context built by the driver from already-checked dependency modules.
/// Pre-seeds the type checker's environments before inference begins.
#[derive(Debug, Default)]
pub struct ImportContext {
    /// Module namespace -> exported symbols.
    /// Key is the namespace name used for qualified access (last path segment
    /// for `import Math.Vector` -> key is "Vector").
    pub module_exports: FxHashMap<String, ModuleExports>,

    /// Trait definitions from ALL processed modules (globally visible).
    pub all_trait_defs: Vec<TraitDef>,

    /// Trait impls from ALL processed modules (globally visible, XMOD-05).
    pub all_trait_impls: Vec<TraitImplDef>,

    /// The name of the current module being type-checked (e.g., "Geometry").
    /// None for single-file mode (backward compat). Used to set display_prefix
    /// on locally-defined types in error messages.
    pub current_module: Option<String>,
}

impl ImportContext {
    /// Create an empty import context (for single-file / backward compat).
    pub fn empty() -> Self {
        Self::default()
    }
}

/// Exports from a single module.
#[derive(Debug, Default, Clone)]
pub struct ModuleExports {
    /// The full module name (e.g., "Math.Vector").
    pub module_name: String,

    /// Function/value type schemes, keyed by unqualified name.
    pub functions: FxHashMap<String, Scheme>,

    /// Struct definitions exported by this module.
    pub struct_defs: FxHashMap<String, StructDefInfo>,

    /// Sum type definitions exported by this module.
    pub sum_type_defs: FxHashMap<String, SumTypeDefInfo>,

    /// Service definitions exported by this module.
    pub service_defs: FxHashMap<String, ServiceExportInfo>,

    /// Actor definitions exported by this module (name -> type scheme).
    /// Actors are always exported (no `pub` prefix in grammar, same as services).
    pub actor_defs: FxHashMap<String, Scheme>,

    /// Names of private (non-pub) items, for distinguishing "private" from "nonexistent" in errors.
    pub private_names: FxHashSet<String>,

    /// Type aliases exported by this module (pub type only).
    pub type_aliases: FxHashMap<String, TypeAliasInfo>,
}

/// Symbols exported by a module after type checking.
#[derive(Debug, Default, Clone)]
pub struct ExportedSymbols {
    /// Function type schemes (name -> scheme).
    pub functions: FxHashMap<String, Scheme>,
    /// Struct definitions.
    pub struct_defs: FxHashMap<String, StructDefInfo>,
    /// Sum type definitions.
    pub sum_type_defs: FxHashMap<String, SumTypeDefInfo>,
    /// Service definitions with helper function info.
    pub service_defs: FxHashMap<String, ServiceExportInfo>,
    /// Actor definitions (name -> type scheme).
    pub actor_defs: FxHashMap<String, Scheme>,
    /// Trait definitions declared in this module.
    pub trait_defs: Vec<TraitDef>,
    /// Trait impls declared in this module.
    pub trait_impls: Vec<TraitImplDef>,
    /// Names of private (non-pub) items, for distinguishing "private" from "nonexistent" in errors.
    pub private_names: FxHashSet<String>,
    /// Type alias definitions exported by this module (pub type only).
    pub type_aliases: FxHashMap<String, TypeAliasInfo>,
}

/// Information about an exported service, containing the helper function
/// signatures and method mappings needed by importing modules.
#[derive(Debug, Default, Clone)]
pub struct ServiceExportInfo {
    /// Service name (e.g., "Counter").
    pub name: String,
    /// Helper functions: maps unqualified name (e.g., "start", "increment")
    /// to their type scheme. These are registered as ServiceName.method in
    /// the importing module's type environment.
    pub helpers: FxHashMap<String, Scheme>,
    /// Method names with their generated function names for MIR resolution.
    /// Maps (method_name, generated_fn_name), e.g., ("start", "__service_counter_start").
    pub methods: Vec<(String, String)>,
}

// ── TypeckResult ────────────────────────────────────────────────────────

/// The result of type checking a Mesh program.
///
/// Contains a mapping from source ranges to their inferred types, plus
/// any type errors encountered during checking. Also includes the type
/// registry with struct/sum type/alias definitions needed by codegen
/// to determine memory layouts, and the trait registry for trait method
/// dispatch resolution during MIR lowering.
pub struct TypeckResult {
    /// Map from source text ranges to their inferred types.
    pub types: FxHashMap<TextRange, Ty>,
    /// Type errors found during checking.
    pub errors: Vec<TypeError>,
    /// Warnings found during checking (e.g. redundant match arms).
    pub warnings: Vec<TypeError>,
    /// The inferred type of the last expression/item in the program.
    /// `None` if the program has no items or only produces errors.
    pub result_type: Option<Ty>,
    /// Registry of all struct, sum type, and type alias definitions.
    /// Used by codegen to determine memory layouts and variant tags.
    pub type_registry: TypeRegistry,
    /// Registry of all trait definitions and impl registrations.
    /// Used by codegen for trait method dispatch resolution.
    pub trait_registry: TraitRegistry,
    /// Default method bodies from interface definitions.
    /// Keyed by `(trait_name, method_name)`, value is the text range of the
    /// INTERFACE_METHOD node that contains the default body. The lowerer
    /// uses this range to find the method's AST node from the parse tree.
    pub default_method_bodies: FxHashMap<(String, String), TextRange>,
    /// Qualified module names used by this module via `import` declarations.
    /// Maps namespace name (e.g., "Math") to the list of exported function names.
    /// Used by the MIR lowerer to resolve qualified access (e.g., Math.add).
    pub qualified_modules: FxHashMap<String, Vec<String>>,
    /// Function names imported via `from Module import name1, name2` (selective imports).
    /// These names are directly callable without qualification.
    /// Used by the MIR lowerer to skip trait dispatch for imported functions.
    pub imported_functions: Vec<String>,
    /// Service method mappings imported from other modules.
    /// Maps service_name -> Vec<(method_name, generated_fn_name)>.
    /// Used by the MIR lowerer to populate service_modules for cross-module calls.
    pub imported_service_methods: FxHashMap<String, Vec<(String, String)>>,
    /// Locally-defined service export info (for collect_exports).
    /// Maps service_name -> ServiceExportInfo with resolved helper types.
    /// Populated during infer_service_def, consumed by collect_exports.
    pub local_service_exports: FxHashMap<String, ServiceExportInfo>,
    /// Maps call-site TextRange -> mangled callee name (e.g. "slugify__2").
    /// Non-empty only when the source file has arity-overloaded pub fns.
    /// Consumed by the MIR lowerer to emit the correct mangled function reference.
    pub overloaded_call_targets: FxHashMap<TextRange, String>,
}

impl TypeckResult {
    /// Render all type errors as formatted diagnostic strings.
    ///
    /// Accepts `DiagnosticOptions` to control color and output format.
    /// Each error is rendered with labeled source spans, error codes, and
    /// fix suggestions when applicable.
    pub fn render_errors(&self, source: &str, filename: &str, options: &DiagnosticOptions) -> Vec<String> {
        self.errors
            .iter()
            .map(|err| diagnostics::render_diagnostic(err, source, filename, options, None))
            .collect()
    }
}

/// Type-check a parsed Mesh program.
///
/// This is the main entry point for the type checker. It walks the AST,
/// infers types for all expressions, checks type annotations, and reports
/// errors.
pub fn check(parse: &mesh_parser::Parse) -> TypeckResult {
    infer::infer(parse)
}

/// Type-check a parsed Mesh program with pre-resolved imports.
///
/// This is the multi-module entry point. The ImportContext contains
/// symbols from already-type-checked dependency modules.
pub fn check_with_imports(parse: &mesh_parser::Parse, import_ctx: &ImportContext) -> TypeckResult {
    infer::infer_with_imports(parse, import_ctx)
}

/// Collect exported symbols from a type-checked module.
///
/// Currently exports ALL top-level definitions (Phase 40 adds pub filtering).
/// Extracts function schemes from the typeck types map by scanning the parse
/// tree for FnDef items, struct/sum type defs from TypeRegistry, and
/// trait defs/impls from TraitRegistry.
pub fn collect_exports(
    parse: &mesh_parser::Parse,
    typeck: &TypeckResult,
) -> ExportedSymbols {
    use mesh_parser::ast::item::Item;
    use mesh_parser::ast::AstNode;
    use mesh_parser::syntax_kind::SyntaxKind;

    let tree = parse.tree();
    let mut exports = ExportedSymbols::default();

    // First pass: count pub fn occurrences by name to detect arity overloading.
    let mut pub_fn_counts: FxHashMap<String, usize> = FxHashMap::default();
    for item in tree.items() {
        if let Item::FnDef(fn_def) = &item {
            if fn_def.visibility().is_some() {
                if let Some(name) = fn_def.name().and_then(|n| n.text()) {
                    *pub_fn_counts.entry(name).or_insert(0) += 1;
                }
            }
        }
    }

    for item in tree.items() {
        match item {
            Item::FnDef(fn_def) => {
                if let Some(name) = fn_def.name().and_then(|n| n.text()) {
                    // Look up the function's inferred type from the typeck result
                    let range = fn_def.syntax().text_range();
                    if let Some(ty) = typeck.types.get(&range) {
                        if fn_def.visibility().is_some() {
                            // Mangle name if multiple pub fns share the same name (arity overloading).
                            let export_name = if pub_fn_counts.get(&name).copied().unwrap_or(0) > 1 {
                                let arity = fn_def
                                    .param_list()
                                    .map(|pl| pl.params().count())
                                    .unwrap_or(0);
                                format!("{}__{}", name, arity)
                            } else {
                                name
                            };
                            exports.functions.insert(
                                export_name,
                                Scheme::normalize_from_ty(ty.clone()),
                            );
                        } else {
                            exports.private_names.insert(name);
                        }
                    }
                }
            }
            _ => {}
        }
    }

    // Copy struct defs from type_registry, filtered by AST visibility
    for item in tree.items() {
        if let Item::StructDef(struct_def) = &item {
            if let Some(name) = struct_def.name().and_then(|n| n.text()) {
                if struct_def.visibility().is_some() {
                    if let Some(def) = typeck.type_registry.struct_defs.get(&name) {
                        exports.struct_defs.insert(name, def.clone());
                    }
                } else {
                    exports.private_names.insert(name);
                }
            }
        }
    }

    // Copy sum type defs from type_registry, filtered by AST visibility
    // (filter out builtins: Option, Result, Ordering are built-in)
    let builtin_sum_types = ["Option", "Result", "Ordering"];
    for item in tree.items() {
        if let Item::SumTypeDef(sum_def) = &item {
            if let Some(name) = sum_def.name().and_then(|n| n.text()) {
                if !builtin_sum_types.contains(&name.as_str()) {
                    if sum_def.visibility().is_some() {
                        if let Some(def) = typeck.type_registry.sum_type_defs.get(&name) {
                            exports.sum_type_defs.insert(name, def.clone());
                        }
                    } else {
                        exports.private_names.insert(name);
                    }
                }
            }
        }
    }

    // Copy pub type aliases from type_registry, filtered by AST visibility
    for item in tree.items() {
        if let Item::TypeAliasDef(alias_def) = &item {
            if let Some(name) = alias_def.name().and_then(|n| n.text()) {
                if alias_def.visibility().is_some() {
                    if let Some(def) = typeck.type_registry.type_aliases.get(&name) {
                        exports.type_aliases.insert(name, def.clone());
                    }
                } else {
                    exports.private_names.insert(name);
                }
            }
        }
    }

    // Copy service defs from typeck.local_service_exports.
    // Services are always exported (no `pub` prefix in current grammar).
    for (name, info) in &typeck.local_service_exports {
        exports.service_defs.insert(name.clone(), info.clone());
    }

    // Copy actor defs from typeck.types via AST traversal.
    // Actors are always exported (no `pub` prefix in current grammar, same as services).
    for item in tree.items() {
        if let Item::ActorDef(actor_def) = item {
            if let Some(name) = actor_def.name().and_then(|n| n.text()) {
                let range = actor_def.syntax().text_range();
                if let Some(ty) = typeck.types.get(&range) {
                    exports.actor_defs.insert(
                        name,
                        Scheme::normalize_from_ty(ty.clone()),
                    );
                }
            }
        }
    }

    // Extract trait defs from AST InterfaceDef items, filtered by visibility.
    for item in tree.items() {
        if let Item::InterfaceDef(iface) = item {
            if let Some(name) = iface.name().and_then(|n| n.text()) {
                if iface.visibility().is_some() {
                    if let Some(trait_def) = typeck.trait_registry.get_trait(&name) {
                        exports.trait_defs.push(trait_def.clone());
                    }
                } else {
                    exports.private_names.insert(name);
                }
            }
        }
    }

    // For trait impls: collect from explicit `impl Trait for Type` AST nodes,
    // plus impls generated by `deriving(...)` clauses on structs/sum types.
    let mut local_impl_traits: Vec<(String, String)> = Vec::new(); // (trait_name, type_name)

    // 1. Explicit impl blocks in the AST.
    for item in tree.items() {
        if let Item::ImplDef(ref impl_def) = item {
            // Extract trait name from the first PATH child.
            let paths: Vec<_> = impl_def
                .syntax()
                .children()
                .filter(|n| n.kind() == SyntaxKind::PATH)
                .collect();

            let trait_name = paths
                .first()
                .and_then(|path| {
                    path.children_with_tokens()
                        .filter_map(|t| t.into_token())
                        .find(|t| t.kind() == SyntaxKind::IDENT)
                        .map(|t| t.text().to_string())
                });

            // Extract type name from the second PATH child (after `for`).
            let type_name = paths
                .get(1)
                .and_then(|path| {
                    path.children_with_tokens()
                        .filter_map(|t| t.into_token())
                        .find(|t| t.kind() == SyntaxKind::IDENT)
                        .map(|t| t.text().to_string())
                });

            if let (Some(tn), Some(ty)) = (trait_name, type_name) {
                local_impl_traits.push((tn, ty));
            }
        }
    }

    // 2. Impls generated by deriving(...) clauses on structs and sum types.
    //    These don't have explicit ImplDef AST nodes but are registered in
    //    the trait registry during struct/sum type processing.
    for item in tree.items() {
        let (type_name, derive_traits) = match &item {
            Item::StructDef(struct_def) => {
                let name = struct_def.name().and_then(|n| n.text());
                let traits = struct_def.deriving_traits();
                (name, traits)
            }
            Item::SumTypeDef(sum_def) => {
                let name = sum_def.name().and_then(|n| n.text());
                let traits = sum_def.deriving_traits();
                (name, traits)
            }
            _ => (None, vec![]),
        };
        if let Some(type_name) = type_name {
            for trait_name in derive_traits {
                // Map user-facing derive names to internal trait names.
                // "Json" derives both ToJson and FromJson.
                let internal_traits: &[&str] = match trait_name.as_str() {
                    "Json" => &["ToJson", "FromJson"],
                    "Row" => &["FromRow"],
                    _ => {
                        // For Eq, Ord, Display, Debug, Hash, Schema etc.
                        // store the name directly -- we'll match below.
                        &[]  // handled by pushing single name
                    }
                };
                if internal_traits.is_empty() {
                    local_impl_traits.push((trait_name, type_name.clone()));
                } else {
                    for &t in internal_traits {
                        local_impl_traits.push((t.to_string(), type_name.clone()));
                    }
                }
            }
        }
    }

    for impl_def in typeck.trait_registry.all_impls() {
        for (tn, ty) in &local_impl_traits {
            if impl_def.trait_name == *tn && impl_def.impl_type_name == *ty {
                // Avoid duplicates (explicit impl + deriving could overlap)
                if !exports.trait_impls.iter().any(|i| i.trait_name == impl_def.trait_name && i.impl_type_name == impl_def.impl_type_name) {
                    exports.trait_impls.push(impl_def.clone());
                }
            }
        }
    }

    exports
}
