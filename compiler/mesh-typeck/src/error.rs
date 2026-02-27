//! Type error types with provenance tracking.
//!
//! Every type error carries a `ConstraintOrigin` that records where the
//! constraint was generated. This enables precise, contextual error messages
//! that point to the exact source location of the mismatch.

use std::fmt;

use rowan::TextRange;

use crate::ty::{Ty, TyVar};

/// The origin of a type constraint -- where in the source code did we
/// decide these two types should be equal?
///
/// Provenance tracking is essential for good error messages. Instead of
/// "expected Int, found String", we can say "argument 2 of `add` expected
/// Int, found String (at line 42)".
#[derive(Clone, Debug)]
pub enum ConstraintOrigin {
    /// From a function argument: `foo(x)` where x's type must match param type.
    FnArg {
        call_site: TextRange,
        param_idx: usize,
    },
    /// From a binary operator: `a + b` where a and b must have compatible types.
    BinOp { op_span: TextRange },
    /// From if/else branches: both branches must have the same type.
    IfBranches {
        if_span: TextRange,
        then_span: TextRange,
        else_span: TextRange,
    },
    /// From a type annotation: `x :: Int` where x must be Int.
    Annotation { annotation_span: TextRange },
    /// From a return expression: return type must match function signature.
    Return {
        return_span: TextRange,
        fn_span: TextRange,
    },
    /// From a let binding: `let x = expr` where inferred type of expr is bound.
    LetBinding { binding_span: TextRange },
    /// From an assignment: `x = expr` where lhs and rhs must match.
    Assignment {
        lhs_span: TextRange,
        rhs_span: TextRange,
    },
    /// Synthetic origin for built-in constraints (e.g. arithmetic operators).
    Builtin,
}

/// A type error encountered during type checking.
///
/// Each variant carries enough information to produce a clear, actionable
/// error message including the source location and expected vs. actual types.
#[derive(Clone, Debug)]
pub enum TypeError {
    /// Two types that should be equal are not.
    Mismatch {
        expected: Ty,
        found: Ty,
        origin: ConstraintOrigin,
    },
    /// A type variable appears in its own definition (infinite type).
    ///
    /// Example: trying to unify `a` with `(a) -> Int` creates an infinite
    /// type `(((((...) -> Int) -> Int) -> Int) -> Int)`.
    InfiniteType {
        var: TyVar,
        ty: Ty,
        origin: ConstraintOrigin,
    },
    /// Function called with wrong number of arguments.
    ArityMismatch {
        expected: usize,
        found: usize,
        origin: ConstraintOrigin,
    },
    /// Slot pipe position N conflicts with an explicitly provided argument.
    ///
    /// Example: `x |2> func(a, b)` — position 2 is already filled by `b`.
    SlotPositionConflict {
        /// The 1-indexed slot position that conflicts.
        slot: u32,
        /// Name of the function being called.
        fn_name: String,
        span: TextRange,
    },
    /// Slot pipe position N exceeds the function's total arity.
    ///
    /// Example: `x |5> func(a, b, c)` — func only takes 3 arguments.
    SlotPipeOutOfRange {
        /// The slot position used (1-indexed).
        slot: u32,
        /// Name of the function being called (empty string if unknown).
        fn_name: String,
        /// Total arity of the function (including all parameters).
        arity: usize,
        span: TextRange,
    },
    /// A variable is used but not defined in scope.
    UnboundVariable { name: String, span: TextRange },
    /// A non-function value is called as a function.
    NotAFunction { ty: Ty, span: TextRange },
    /// A type does not satisfy a required trait constraint.
    TraitNotSatisfied {
        ty: Ty,
        trait_name: String,
        origin: ConstraintOrigin,
    },
    /// An impl block is missing a method required by the trait.
    MissingTraitMethod {
        trait_name: String,
        method_name: String,
        impl_ty: String,
    },
    /// An impl method's signature does not match the trait's method signature.
    TraitMethodSignatureMismatch {
        trait_name: String,
        method_name: String,
        expected: Ty,
        found: Ty,
    },
    /// A struct literal is missing a required field.
    MissingField {
        struct_name: String,
        field_name: String,
        span: TextRange,
    },
    /// A struct literal references an unknown field.
    UnknownField {
        struct_name: String,
        field_name: String,
        span: TextRange,
    },
    /// A field access on a type with no such field.
    NoSuchField {
        ty: Ty,
        field_name: String,
        span: TextRange,
    },
    /// A method call on a type with no such method.
    NoSuchMethod {
        ty: Ty,
        method_name: String,
        span: TextRange,
    },
    /// A variant name was used in a pattern but does not exist.
    UnknownVariant {
        name: String,
        span: TextRange,
    },
    /// Or-pattern alternatives bind different sets of variables.
    OrPatternBindingMismatch {
        expected_bindings: Vec<String>,
        found_bindings: Vec<String>,
        span: TextRange,
    },
    /// A match/case expression is not exhaustive.
    NonExhaustiveMatch {
        scrutinee_type: String,
        missing_patterns: Vec<String>,
        span: TextRange,
    },
    /// A match arm is redundant (unreachable given prior arms).
    RedundantArm {
        arm_index: usize,
        span: TextRange,
    },
    /// A guard expression uses disallowed constructs.
    InvalidGuardExpression {
        reason: String,
        span: TextRange,
    },
    /// Sending a message of wrong type to a typed Pid<M>.
    SendTypeMismatch {
        expected: Ty,
        found: Ty,
        span: TextRange,
    },
    /// self() called outside an actor block.
    SelfOutsideActor {
        span: TextRange,
    },
    /// spawn called with a non-function argument.
    SpawnNonFunction {
        found: Ty,
        span: TextRange,
    },
    /// receive used outside an actor block.
    ReceiveOutsideActor {
        span: TextRange,
    },
    /// Child spec start function does not return Pid.
    InvalidChildStart {
        child_name: String,
        found: Ty,
        span: TextRange,
    },
    /// Unknown supervision strategy.
    InvalidStrategy {
        found: String,
        span: TextRange,
    },
    /// Invalid restart type for child spec.
    InvalidRestartType {
        found: String,
        child_name: String,
        span: TextRange,
    },
    /// Invalid shutdown value for child spec.
    InvalidShutdownValue {
        found: String,
        child_name: String,
        span: TextRange,
    },
    /// A catch-all clause appears before the last position in a multi-clause function.
    CatchAllNotLast {
        fn_name: String,
        arity: usize,
        span: TextRange,
    },
    /// A multi-clause function has non-consecutive clauses (same name appears in separate groups).
    NonConsecutiveClauses {
        fn_name: String,
        arity: usize,
        first_span: TextRange,
        second_span: TextRange,
    },
    /// Clauses in a multi-clause function have inconsistent arities.
    ClauseArityMismatch {
        fn_name: String,
        expected_arity: usize,
        found_arity: usize,
        span: TextRange,
    },
    /// Visibility/generics/return type on a non-first clause of a multi-clause function.
    NonFirstClauseAnnotation {
        fn_name: String,
        what: String,
        span: TextRange,
    },
    /// Guard expression type is not Bool.
    GuardTypeMismatch {
        expected: Ty,
        found: Ty,
        span: TextRange,
    },
    /// Two impl blocks implement the same trait for the same type (or structurally overlapping types).
    DuplicateImpl {
        trait_name: String,
        impl_type: String,
        /// Description of the first impl location (e.g. "previously defined here").
        first_impl: String,
    },
    /// Multiple traits provide a method with the same name for a given type, causing ambiguity.
    AmbiguousMethod {
        method_name: String,
        /// The trait names that all provide this method.
        candidate_traits: Vec<String>,
        ty: Ty,
        span: TextRange,
    },
    /// An unsupported trait name appears in a deriving clause.
    UnsupportedDerive {
        trait_name: String,
        type_name: String,
    },
    /// A derived trait requires another trait that is not in the deriving list.
    MissingDerivePrerequisite {
        trait_name: String,
        requires: String,
        type_name: String,
    },
    /// `break` used outside of a loop.
    BreakOutsideLoop {
        span: TextRange,
    },
    /// `continue` used outside of a loop.
    ContinueOutsideLoop {
        span: TextRange,
    },
    /// Module not found during import resolution (IMPORT-06).
    ImportModuleNotFound {
        module_name: String,
        span: TextRange,
        /// Optional suggestion (closest module name match).
        suggestion: Option<String>,
    },
    /// Name not found in imported module (IMPORT-07).
    ImportNameNotFound {
        module_name: String,
        name: String,
        span: TextRange,
        /// Available names in the module (for "did you mean?" suggestions).
        available: Vec<String>,
    },
    /// Attempted to import a private (non-pub) item from a module (VIS-03).
    PrivateItem {
        module_name: String,
        name: String,
        span: TextRange,
    },
    /// `?` operator used in function that doesn't return Result or Option.
    TryIncompatibleReturn {
        /// The type of the operand (e.g., Result<Int, String>).
        operand_ty: Ty,
        /// The enclosing function's return type (e.g., Int).
        fn_return_ty: Ty,
        span: TextRange,
    },
    /// `?` operator used on a value that is not Result or Option.
    TryOnNonResultOption {
        /// The actual type of the operand.
        operand_ty: Ty,
        span: TextRange,
    },
    /// A field type in a `deriving(Json)` struct is not JSON-serializable.
    NonSerializableField {
        struct_name: String,
        field_name: String,
        field_type: String,
    },
    /// A field type in a `deriving(Row)` struct is not row-mappable.
    NonMappableField {
        struct_name: String,
        field_name: String,
        field_type: String,
    },
    /// An impl block is missing a required associated type declared by the trait.
    MissingAssocType {
        trait_name: String,
        assoc_name: String,
        impl_ty: String,
    },
    /// An impl block provides an associated type not declared by the trait.
    ExtraAssocType {
        trait_name: String,
        assoc_name: String,
        impl_ty: String,
    },
    /// An associated type reference (Self.Item) could not be resolved.
    UnresolvedAssocType {
        assoc_name: String,
        span: TextRange,
    },
    /// A type alias references a type name that does not exist (ALIAS-04).
    UndefinedType {
        /// The name of the type alias.
        alias_name: String,
        /// The target type name that could not be resolved.
        target_name: String,
        span: TextRange,
    },
}

impl fmt::Display for TypeError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            TypeError::Mismatch {
                expected, found, ..
            } => {
                write!(f, "type mismatch: expected `{}`, found `{}`", expected, found)
            }
            TypeError::InfiniteType { var, ty, .. } => {
                write!(
                    f,
                    "infinite type: `?{}` occurs in `{}`",
                    var.0, ty
                )
            }
            TypeError::ArityMismatch {
                expected, found, ..
            } => {
                write!(
                    f,
                    "arity mismatch: expected {} arguments, found {}",
                    expected, found
                )
            }
            TypeError::SlotPositionConflict {
                slot, fn_name, ..
            } => {
                write!(
                    f,
                    "slot position {} conflicts with an argument already provided to `{}`",
                    slot, fn_name
                )
            }
            TypeError::SlotPipeOutOfRange {
                slot, fn_name, arity, ..
            } => {
                if *arity <= 1 {
                    write!(
                        f,
                        "slot position {} is out of range: `{}` takes {} argument(s), so valid slot positions are none — use |> instead",
                        slot, fn_name, arity
                    )
                } else {
                    write!(
                        f,
                        "slot position {} is out of range: `{}` takes {} arguments, so valid slot positions are 2\u{2013}{}",
                        slot, fn_name, arity, arity
                    )
                }
            }
            TypeError::UnboundVariable { name, .. } => {
                write!(f, "unbound variable `{}`", name)
            }
            TypeError::NotAFunction { ty, .. } => {
                write!(f, "`{}` is not a function", ty)
            }
            TypeError::TraitNotSatisfied {
                ty, trait_name, ..
            } => {
                write!(
                    f,
                    "type `{}` does not satisfy trait `{}`",
                    ty, trait_name
                )
            }
            TypeError::MissingTraitMethod {
                trait_name,
                method_name,
                impl_ty,
            } => {
                write!(
                    f,
                    "impl `{}` for `{}` is missing method `{}`",
                    trait_name, impl_ty, method_name
                )
            }
            TypeError::TraitMethodSignatureMismatch {
                trait_name,
                method_name,
                expected,
                found,
            } => {
                write!(
                    f,
                    "method `{}` in impl `{}` has wrong signature: expected `{}`, found `{}`",
                    method_name, trait_name, expected, found
                )
            }
            TypeError::MissingField {
                struct_name,
                field_name,
                ..
            } => {
                write!(
                    f,
                    "missing field `{}` in struct `{}`",
                    field_name, struct_name
                )
            }
            TypeError::UnknownField {
                struct_name,
                field_name,
                ..
            } => {
                write!(
                    f,
                    "unknown field `{}` in struct `{}`",
                    field_name, struct_name
                )
            }
            TypeError::NoSuchField {
                ty, field_name, ..
            } => {
                write!(f, "type `{}` has no field `{}`", ty, field_name)
            }
            TypeError::NoSuchMethod {
                ty, method_name, ..
            } => {
                write!(f, "no method `{}` on type `{}`", method_name, ty)
            }
            TypeError::UnknownVariant { name, .. } => {
                write!(f, "unknown variant `{}`", name)
            }
            TypeError::OrPatternBindingMismatch {
                expected_bindings,
                found_bindings,
                ..
            } => {
                write!(
                    f,
                    "or-pattern binding mismatch: expected [{}], found [{}]",
                    expected_bindings.join(", "),
                    found_bindings.join(", ")
                )
            }
            TypeError::NonExhaustiveMatch {
                scrutinee_type,
                missing_patterns,
                ..
            } => {
                write!(
                    f,
                    "non-exhaustive match on `{}`: missing patterns [{}]",
                    scrutinee_type,
                    missing_patterns.join(", ")
                )
            }
            TypeError::RedundantArm { arm_index, .. } => {
                write!(f, "redundant match arm at index {}", arm_index)
            }
            TypeError::InvalidGuardExpression { reason, .. } => {
                write!(f, "invalid guard expression: {}", reason)
            }
            TypeError::SendTypeMismatch {
                expected, found, ..
            } => {
                write!(
                    f,
                    "message type mismatch: expected `{}`, found `{}`",
                    expected, found
                )
            }
            TypeError::SelfOutsideActor { .. } => {
                write!(f, "self() used outside actor block")
            }
            TypeError::SpawnNonFunction { found, .. } => {
                write!(f, "cannot spawn non-function: found `{}`", found)
            }
            TypeError::ReceiveOutsideActor { .. } => {
                write!(f, "receive used outside actor block")
            }
            TypeError::InvalidChildStart {
                child_name, found, ..
            } => {
                write!(
                    f,
                    "child `{}` start function must return Pid, found `{}`",
                    child_name, found
                )
            }
            TypeError::InvalidStrategy { found, .. } => {
                write!(
                    f,
                    "unknown supervision strategy `{}`, expected one_for_one, one_for_all, rest_for_one, or simple_one_for_one",
                    found
                )
            }
            TypeError::InvalidRestartType {
                found, child_name, ..
            } => {
                write!(
                    f,
                    "invalid restart type `{}` for child `{}`, expected permanent, transient, or temporary",
                    found, child_name
                )
            }
            TypeError::InvalidShutdownValue {
                found, child_name, ..
            } => {
                write!(
                    f,
                    "invalid shutdown value `{}` for child `{}`, expected a positive integer or brutal_kill",
                    found, child_name
                )
            }
            TypeError::CatchAllNotLast {
                fn_name, arity, ..
            } => {
                write!(
                    f,
                    "catch-all clause must be the last clause of function `{}/{}`; clauses after a catch-all are unreachable",
                    fn_name, arity
                )
            }
            TypeError::NonConsecutiveClauses {
                fn_name, arity, ..
            } => {
                write!(
                    f,
                    "function `{}/{}` already defined; multi-clause functions must have consecutive clauses",
                    fn_name, arity
                )
            }
            TypeError::ClauseArityMismatch {
                fn_name,
                expected_arity,
                found_arity,
                ..
            } => {
                write!(
                    f,
                    "all clauses of `{}` must have the same number of parameters; expected {}, found {}",
                    fn_name, expected_arity, found_arity
                )
            }
            TypeError::NonFirstClauseAnnotation {
                fn_name, what, ..
            } => {
                write!(
                    f,
                    "{} on non-first clause of `{}` will be ignored",
                    what, fn_name
                )
            }
            TypeError::GuardTypeMismatch {
                expected, found, ..
            } => {
                write!(
                    f,
                    "guard expression must return `{}`, found `{}`",
                    expected, found
                )
            }
            TypeError::DuplicateImpl {
                trait_name,
                impl_type,
                first_impl,
            } => {
                write!(
                    f,
                    "duplicate impl: `{}` is already implemented for `{}` ({})",
                    trait_name, impl_type, first_impl
                )
            }
            TypeError::AmbiguousMethod {
                method_name,
                candidate_traits,
                ty,
                span: _,
            } => {
                write!(
                    f,
                    "ambiguous method `{}` for type `{}`: candidates from traits [{}]",
                    method_name,
                    ty,
                    candidate_traits.join(", ")
                )
            }
            TypeError::UnsupportedDerive {
                trait_name,
                type_name,
            } => {
                write!(
                    f,
                    "cannot derive `{}` for `{}` -- only Eq, Ord, Display, Debug, Hash, Json, and Row are derivable",
                    trait_name, type_name
                )
            }
            TypeError::MissingDerivePrerequisite {
                trait_name,
                requires,
                type_name,
            } => {
                write!(
                    f,
                    "deriving `{}` for `{}` requires `{}` to also be derived",
                    trait_name, type_name, requires
                )
            }
            TypeError::BreakOutsideLoop { .. } => {
                write!(f, "`break` outside of loop")
            }
            TypeError::ContinueOutsideLoop { .. } => {
                write!(f, "`continue` outside of loop")
            }
            TypeError::ImportModuleNotFound { module_name, suggestion, .. } => {
                if let Some(sug) = suggestion {
                    write!(f, "module `{}` not found; did you mean `{}`?", module_name, sug)
                } else {
                    write!(f, "module `{}` not found", module_name)
                }
            }
            TypeError::ImportNameNotFound { module_name, name, available, .. } => {
                if available.is_empty() {
                    write!(f, "`{}` is not exported by module `{}`", name, module_name)
                } else {
                    write!(f, "`{}` is not exported by module `{}`; available: {}", name, module_name, available.join(", "))
                }
            }
            TypeError::PrivateItem { module_name, name, .. } => {
                write!(f, "`{}` is private in module `{}`; add `pub` to make it accessible", name, module_name)
            }
            TypeError::TryIncompatibleReturn { fn_return_ty, .. } => {
                write!(f, "`?` operator requires function to return `Result` or `Option`, found `{}`", fn_return_ty)
            }
            TypeError::TryOnNonResultOption { operand_ty, .. } => {
                write!(f, "`?` operator requires `Result` or `Option`, found `{}`", operand_ty)
            }
            TypeError::NonSerializableField {
                field_name,
                field_type,
                ..
            } => {
                write!(
                    f,
                    "field `{}` of type `{}` is not JSON-serializable",
                    field_name, field_type
                )
            }
            TypeError::NonMappableField {
                field_name,
                field_type,
                ..
            } => {
                write!(
                    f,
                    "field `{}` has type `{}` which cannot be mapped from a database row (only Int, Float, Bool, String, and Option<T> are supported)",
                    field_name, field_type
                )
            }
            TypeError::MissingAssocType {
                trait_name,
                assoc_name,
                impl_ty,
            } => {
                write!(
                    f,
                    "impl `{}` for `{}` is missing associated type `{}`",
                    trait_name, impl_ty, assoc_name
                )
            }
            TypeError::ExtraAssocType {
                trait_name,
                assoc_name,
                impl_ty,
            } => {
                write!(
                    f,
                    "impl `{}` for `{}` provides associated type `{}` which is not declared by the trait",
                    trait_name, impl_ty, assoc_name
                )
            }
            TypeError::UnresolvedAssocType {
                assoc_name,
                ..
            } => {
                write!(
                    f,
                    "cannot resolve associated type `{}` -- Self.Item can only be used inside an impl block",
                    assoc_name
                )
            }
            TypeError::UndefinedType {
                alias_name,
                target_name,
                ..
            } => {
                write!(
                    f,
                    "type alias `{}` references undefined type `{}`",
                    alias_name, target_name
                )
            }
        }
    }
}
