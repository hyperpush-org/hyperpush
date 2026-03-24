//! CST-to-FormatIR walker for Mesh source code.
//!
//! This module walks the rowan CST produced by `mesh-parser` and converts it
//! into a `FormatIR` document tree. The walker processes all tokens including
//! trivia (comments, newlines) to preserve them in the formatted output.
//!
//! The walker dispatches on `SyntaxKind` for each CST node, producing
//! appropriate `FormatIR` structures for indentation, grouping, and line
//! breaking.
//!
//! NOTE: `ir::space()` means "space in flat mode, newline+indent in break mode".
//! Since the root context is always break mode, we use `sp()` (literal text " ")
//! for unconditional spaces, and reserve `ir::space()` for inside `Group` nodes.

use mesh_parser::{SyntaxKind, SyntaxNode, SyntaxToken};
use rowan::NodeOrToken;

use crate::ir::{self, FormatIR};

/// Literal space text -- always emits " " regardless of mode.
/// Use this for unconditional spaces (e.g., between `fn` and name).
/// Use `ir::space()` only inside `Group` nodes where break behavior is desired.
fn sp() -> FormatIR {
    ir::text(" ")
}

/// Walk a CST node and produce a FormatIR document tree.
///
/// This is the main entry point for converting a parsed Mesh syntax tree
/// into the format IR that the printer can render.
pub fn walk_node(node: &SyntaxNode) -> FormatIR {
    let kind = node.kind();
    match kind {
        SyntaxKind::SOURCE_FILE => walk_source_file(node),
        SyntaxKind::FN_DEF => walk_fn_def(node),
        SyntaxKind::LET_BINDING => walk_let_binding(node),
        SyntaxKind::IF_EXPR => walk_if_expr(node),
        SyntaxKind::CASE_EXPR => walk_case_expr(node),
        SyntaxKind::MATCH_ARM => walk_match_arm(node),
        SyntaxKind::BINARY_EXPR => walk_binary_expr(node),
        SyntaxKind::UNARY_EXPR => walk_unary_expr(node),
        SyntaxKind::CALL_EXPR => walk_call_expr(node),
        SyntaxKind::PIPE_EXPR => walk_pipe_expr(node),
        SyntaxKind::BLOCK => walk_block(node),
        SyntaxKind::PARAM_LIST => walk_paren_list(node),
        SyntaxKind::ARG_LIST => walk_paren_list(node),
        SyntaxKind::MODULE_DEF => walk_block_def(node),
        SyntaxKind::STRUCT_DEF => walk_struct_def(node),
        SyntaxKind::STRUCT_FIELD => walk_struct_field(node),
        SyntaxKind::CLOSURE_EXPR => walk_closure_expr(node),
        SyntaxKind::CLOSURE_CLAUSE => walk_closure_clause(node),
        SyntaxKind::RETURN_EXPR => walk_return_expr(node),
        SyntaxKind::IMPORT_DECL => walk_import_decl(node),
        SyntaxKind::FROM_IMPORT_DECL => walk_from_import_decl(node),
        SyntaxKind::IMPORT_LIST => walk_import_list(node),
        SyntaxKind::STRING_EXPR => walk_string_expr(node),
        SyntaxKind::TUPLE_EXPR => walk_paren_list(node),
        SyntaxKind::FIELD_ACCESS => walk_field_access(node),
        SyntaxKind::INDEX_EXPR => walk_index_expr(node),
        SyntaxKind::ELSE_BRANCH => walk_else_branch(node),
        SyntaxKind::INTERFACE_DEF => walk_block_def(node),
        SyntaxKind::IMPL_DEF => walk_impl_def(node),
        SyntaxKind::TYPE_ALIAS_DEF => walk_type_alias_def(node),
        SyntaxKind::SUM_TYPE_DEF => walk_block_def(node),
        SyntaxKind::VARIANT_DEF => walk_variant_def(node),
        SyntaxKind::ACTOR_DEF => walk_block_def(node),
        SyntaxKind::SERVICE_DEF => walk_block_def(node),
        SyntaxKind::SUPERVISOR_DEF => walk_block_def(node),
        SyntaxKind::RECEIVE_EXPR => walk_receive_expr(node),
        SyntaxKind::RECEIVE_ARM => walk_match_arm(node),
        SyntaxKind::SPAWN_EXPR => walk_spawn_send_link(node),
        SyntaxKind::SEND_EXPR => walk_spawn_send_link(node),
        SyntaxKind::LINK_EXPR => walk_spawn_send_link(node),
        SyntaxKind::WHILE_EXPR => walk_while_expr(node),
        SyntaxKind::FOR_IN_EXPR => walk_for_in_expr(node),
        SyntaxKind::BREAK_EXPR => walk_break_expr(node),
        SyntaxKind::CONTINUE_EXPR => walk_continue_expr(node),
        SyntaxKind::DESTRUCTURE_BINDING => walk_destructure_binding(node),
        SyntaxKind::SELF_EXPR => walk_self_expr(node),
        SyntaxKind::CALL_HANDLER => walk_call_handler(node),
        SyntaxKind::CAST_HANDLER => walk_cast_handler(node),
        SyntaxKind::TERMINATE_CLAUSE => walk_terminate_clause(node),
        SyntaxKind::CHILD_SPEC_DEF => walk_child_spec_def(node),
        SyntaxKind::STRUCT_LITERAL => walk_struct_literal(node),
        SyntaxKind::MAP_LITERAL => walk_map_literal(node),
        SyntaxKind::MAP_ENTRY => walk_map_entry(node),
        SyntaxKind::LIST_LITERAL => walk_list_literal(node),
        SyntaxKind::ASSOC_TYPE_BINDING => walk_assoc_type_binding(node),
        SyntaxKind::TRY_EXPR => walk_tokens_inline(node),
        SyntaxKind::PATH => walk_path(node),
        // Simple leaf-like nodes: just emit their tokens inline.
        SyntaxKind::LITERAL
        | SyntaxKind::NAME
        | SyntaxKind::NAME_REF
        | SyntaxKind::TYPE_ANNOTATION
        | SyntaxKind::VISIBILITY
        | SyntaxKind::WILDCARD_PAT
        | SyntaxKind::IDENT_PAT
        | SyntaxKind::LITERAL_PAT
        | SyntaxKind::TUPLE_PAT
        | SyntaxKind::STRUCT_PAT
        | SyntaxKind::CONSTRUCTOR_PAT
        | SyntaxKind::OR_PAT
        | SyntaxKind::AS_PAT
        | SyntaxKind::GUARD_CLAUSE
        | SyntaxKind::FN_EXPR_BODY
        | SyntaxKind::INTERPOLATION
        | SyntaxKind::TRAILING_CLOSURE
        | SyntaxKind::TYPE_PARAM_LIST
        | SyntaxKind::GENERIC_PARAM_LIST
        | SyntaxKind::GENERIC_ARG_LIST
        | SyntaxKind::WHERE_CLAUSE
        | SyntaxKind::TRAIT_BOUND
        | SyntaxKind::OPTION_TYPE
        | SyntaxKind::RESULT_TYPE
        | SyntaxKind::INTERFACE_METHOD
        | SyntaxKind::VARIANT_FIELD
        | SyntaxKind::AFTER_CLAUSE
        | SyntaxKind::STRATEGY_CLAUSE
        | SyntaxKind::RESTART_LIMIT
        | SyntaxKind::SECONDS_LIMIT
        | SyntaxKind::STRUCT_LITERAL_FIELD
        | SyntaxKind::ASSOC_TYPE_DEF
        | SyntaxKind::FUN_TYPE
        | SyntaxKind::CONS_PAT
        | SyntaxKind::PARAM => walk_tokens_inline(node),
        // Fallback: emit tokens with spaces.
        _ => walk_tokens_inline(node),
    }
}

// ── Source file (top-level) ────────────────────────────────────────────

fn walk_source_file(node: &SyntaxNode) -> FormatIR {
    let mut items: Vec<FormatIR> = Vec::new();
    let mut pending_comment: Option<FormatIR> = None;

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => {
                let kind = tok.kind();
                match kind {
                    SyntaxKind::EOF => {}
                    SyntaxKind::NEWLINE => {}
                    SyntaxKind::COMMENT
                    | SyntaxKind::DOC_COMMENT
                    | SyntaxKind::MODULE_DOC_COMMENT => {
                        if let Some(pc) = pending_comment.take() {
                            items.push(pc);
                        }
                        pending_comment = Some(ir::text(tok.text()));
                    }
                    _ => {}
                }
            }
            NodeOrToken::Node(n) => {
                if let Some(pc) = pending_comment.take() {
                    items.push(pc);
                }
                items.push(walk_node(&n));
            }
        }
    }

    if let Some(pc) = pending_comment.take() {
        items.push(pc);
    }

    // Separate top-level items with blank lines (hardline + hardline).
    if items.is_empty() {
        FormatIR::Empty
    } else {
        let mut parts = Vec::new();
        for (i, item) in items.into_iter().enumerate() {
            if i > 0 {
                parts.push(ir::hardline());
                parts.push(ir::hardline());
            }
            parts.push(item);
        }
        ir::concat(parts)
    }
}

// ── Function definition ──────────────────────────────────────────────

fn walk_fn_def(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();
    let mut has_block = false;
    let mut has_expr_body = false;

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => {
                match tok.kind() {
                    SyntaxKind::FN_KW | SyntaxKind::DEF_KW => {
                        parts.push(ir::text(tok.text()));
                        parts.push(sp());
                    }
                    SyntaxKind::DO_KW => {
                        parts.push(sp());
                        parts.push(ir::text("do"));
                        has_block = true;
                    }
                    SyntaxKind::END_KW => {}
                    SyntaxKind::EQ if !has_block => {
                        // `= expr` body form -- the EQ token before FN_EXPR_BODY.
                        // Don't emit here; it's handled with the FN_EXPR_BODY node.
                    }
                    SyntaxKind::WHEN_KW => {
                        parts.push(sp());
                        parts.push(ir::text("when"));
                        parts.push(sp());
                    }
                    SyntaxKind::NEWLINE => {}
                    SyntaxKind::COMMENT | SyntaxKind::DOC_COMMENT => {
                        parts.push(sp());
                        parts.push(ir::text(tok.text()));
                    }
                    _ => {
                        add_token_with_context(&tok, &mut parts);
                    }
                }
            }
            NodeOrToken::Node(n) => {
                match n.kind() {
                    SyntaxKind::VISIBILITY => {
                        parts.push(walk_node(&n));
                        parts.push(sp());
                    }
                    SyntaxKind::NAME => {
                        parts.push(walk_node(&n));
                    }
                    SyntaxKind::PARAM_LIST => {
                        parts.push(walk_node(&n));
                    }
                    SyntaxKind::TYPE_ANNOTATION => {
                        parts.push(sp());
                        parts.push(walk_node(&n));
                    }
                    SyntaxKind::WHERE_CLAUSE => {
                        parts.push(sp());
                        parts.push(walk_node(&n));
                    }
                    SyntaxKind::GENERIC_PARAM_LIST => {
                        parts.push(walk_node(&n));
                    }
                    SyntaxKind::GUARD_CLAUSE => {
                        // Guard clause: emit space + walk tokens inline.
                        parts.push(sp());
                        parts.push(walk_node(&n));
                    }
                    SyntaxKind::FN_EXPR_BODY => {
                        // `= expr` body form.
                        parts.push(sp());
                        parts.push(ir::text("="));
                        parts.push(sp());
                        // Walk the expression child of FN_EXPR_BODY.
                        for body_child in n.children() {
                            parts.push(walk_node(&body_child));
                        }
                        has_expr_body = true;
                    }
                    SyntaxKind::BLOCK if has_block => {
                        let body = walk_block_body(&n);
                        parts.push(ir::indent(ir::concat(vec![ir::hardline(), body])));
                        parts.push(ir::hardline());
                        parts.push(ir::text("end"));
                    }
                    _ => {
                        if !has_expr_body {
                            parts.push(walk_node(&n));
                        }
                    }
                }
            }
        }
    }

    ir::concat(parts)
}

// ── Let binding ────────────────────────────────────────────────────────

fn walk_let_binding(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::LET_KW => {
                    parts.push(ir::text("let"));
                    parts.push(sp());
                }
                SyntaxKind::EQ => {
                    parts.push(sp());
                    parts.push(ir::text("="));
                    parts.push(sp());
                }
                SyntaxKind::NEWLINE => {}
                _ => {
                    add_token_with_context(&tok, &mut parts);
                }
            },
            NodeOrToken::Node(n) => match n.kind() {
                SyntaxKind::TYPE_ANNOTATION => {
                    parts.push(sp());
                    parts.push(walk_node(&n));
                }
                _ => {
                    parts.push(walk_node(&n));
                }
            },
        }
    }

    ir::group(ir::concat(parts))
}

// ── If expression ────────────────────────────────────────────────────

fn walk_if_expr(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::IF_KW => {
                    parts.push(ir::text("if"));
                    parts.push(sp());
                }
                SyntaxKind::DO_KW => {
                    parts.push(sp());
                    parts.push(ir::text("do"));
                }
                SyntaxKind::END_KW => {
                    parts.push(ir::hardline());
                    parts.push(ir::text("end"));
                }
                SyntaxKind::NEWLINE => {}
                _ => {
                    add_token_with_context(&tok, &mut parts);
                }
            },
            NodeOrToken::Node(n) => {
                match n.kind() {
                    SyntaxKind::BLOCK => {
                        let body = walk_block_body(&n);
                        parts.push(ir::indent(ir::concat(vec![ir::hardline(), body])));
                    }
                    SyntaxKind::ELSE_BRANCH => {
                        parts.push(walk_node(&n));
                    }
                    _ => {
                        // Condition expression.
                        parts.push(walk_node(&n));
                    }
                }
            }
        }
    }

    ir::concat(parts)
}

fn walk_else_branch(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::ELSE_KW => {
                    parts.push(ir::hardline());
                    parts.push(ir::text("else"));
                }
                SyntaxKind::END_KW => {
                    parts.push(ir::hardline());
                    parts.push(ir::text("end"));
                }
                SyntaxKind::NEWLINE => {}
                _ => {
                    add_token_with_context(&tok, &mut parts);
                }
            },
            NodeOrToken::Node(n) => match n.kind() {
                SyntaxKind::BLOCK => {
                    let body = walk_block_body(&n);
                    parts.push(ir::indent(ir::concat(vec![ir::hardline(), body])));
                }
                SyntaxKind::IF_EXPR => {
                    parts.push(sp());
                    parts.push(walk_node(&n));
                }
                _ => {
                    parts.push(walk_node(&n));
                }
            },
        }
    }

    ir::concat(parts)
}

// ── While expression ──────────────────────────────────────────────────

fn walk_while_expr(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::WHILE_KW => {
                    parts.push(ir::text("while"));
                    parts.push(sp());
                }
                SyntaxKind::DO_KW => {
                    parts.push(sp());
                    parts.push(ir::text("do"));
                }
                SyntaxKind::END_KW => {
                    parts.push(ir::hardline());
                    parts.push(ir::text("end"));
                }
                SyntaxKind::NEWLINE => {}
                _ => {
                    add_token_with_context(&tok, &mut parts);
                }
            },
            NodeOrToken::Node(n) => {
                match n.kind() {
                    SyntaxKind::BLOCK => {
                        let body = walk_block_body(&n);
                        parts.push(ir::indent(ir::concat(vec![ir::hardline(), body])));
                    }
                    _ => {
                        // Condition expression.
                        parts.push(walk_node(&n));
                    }
                }
            }
        }
    }

    ir::concat(parts)
}

// ── For-in expression ──────────────────────────────────────────────────

fn walk_for_in_expr(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::FOR_KW => {
                    parts.push(ir::text("for"));
                    parts.push(sp());
                }
                SyntaxKind::IN_KW => {
                    parts.push(sp());
                    parts.push(ir::text("in"));
                    parts.push(sp());
                }
                SyntaxKind::WHEN_KW => {
                    parts.push(sp());
                    parts.push(ir::text("when"));
                    parts.push(sp());
                }
                SyntaxKind::DO_KW => {
                    parts.push(sp());
                    parts.push(ir::text("do"));
                }
                SyntaxKind::END_KW => {
                    parts.push(ir::hardline());
                    parts.push(ir::text("end"));
                }
                SyntaxKind::NEWLINE => {}
                _ => {
                    add_token_with_context(&tok, &mut parts);
                }
            },
            NodeOrToken::Node(n) => {
                match n.kind() {
                    SyntaxKind::BLOCK => {
                        let body = walk_block_body(&n);
                        parts.push(ir::indent(ir::concat(vec![ir::hardline(), body])));
                    }
                    SyntaxKind::NAME => {
                        parts.push(walk_node(&n));
                    }
                    SyntaxKind::DESTRUCTURE_BINDING => {
                        parts.push(walk_destructure_binding(&n));
                    }
                    _ => {
                        // Iterable expression and filter expression.
                        parts.push(walk_node(&n));
                    }
                }
            }
        }
    }

    ir::concat(parts)
}

/// Walk a destructure binding node: `{k, v}`.
fn walk_destructure_binding(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();
    parts.push(ir::text("{"));
    let mut first = true;
    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => {
                match tok.kind() {
                    SyntaxKind::L_BRACE | SyntaxKind::R_BRACE => {
                        // Handled by the explicit { and } text nodes above/below.
                    }
                    SyntaxKind::COMMA => {
                        parts.push(ir::text(","));
                        parts.push(sp());
                    }
                    _ => {}
                }
            }
            NodeOrToken::Node(n) => {
                if n.kind() == SyntaxKind::NAME {
                    if !first {
                        // Comma already added above for non-first names.
                    }
                    parts.push(walk_node(&n));
                    first = false;
                }
            }
        }
    }
    parts.push(ir::text("}"));
    ir::concat(parts)
}

fn walk_break_expr(_node: &SyntaxNode) -> FormatIR {
    ir::text("break")
}

fn walk_continue_expr(_node: &SyntaxNode) -> FormatIR {
    ir::text("continue")
}

// ── Case/match expression ────────────────────────────────────────────

fn walk_case_expr(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();
    let mut arms: Vec<FormatIR> = Vec::new();

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::CASE_KW => {
                    parts.push(ir::text("case"));
                    parts.push(sp());
                }
                SyntaxKind::DO_KW => {
                    parts.push(sp());
                    parts.push(ir::text("do"));
                }
                SyntaxKind::END_KW => {}
                SyntaxKind::NEWLINE => {}
                SyntaxKind::COMMENT | SyntaxKind::DOC_COMMENT => {
                    arms.push(ir::text(tok.text()));
                }
                _ => {}
            },
            NodeOrToken::Node(n) => {
                match n.kind() {
                    SyntaxKind::MATCH_ARM => {
                        arms.push(walk_node(&n));
                    }
                    _ => {
                        // Scrutinee expression.
                        parts.push(walk_node(&n));
                    }
                }
            }
        }
    }

    if !arms.is_empty() {
        let mut arm_parts = Vec::new();
        for arm in arms {
            arm_parts.push(ir::hardline());
            arm_parts.push(arm);
        }
        parts.push(ir::indent(ir::concat(arm_parts)));
    }

    parts.push(ir::hardline());
    parts.push(ir::text("end"));

    ir::concat(parts)
}

fn walk_match_arm(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::ARROW | SyntaxKind::FAT_ARROW => {
                    parts.push(sp());
                    parts.push(ir::text(tok.text()));
                    parts.push(sp());
                }
                SyntaxKind::WHEN_KW => {
                    parts.push(sp());
                    parts.push(ir::text("when"));
                    parts.push(sp());
                }
                SyntaxKind::NEWLINE => {}
                SyntaxKind::COMMENT | SyntaxKind::DOC_COMMENT => {
                    parts.push(sp());
                    parts.push(ir::text(tok.text()));
                }
                _ => {
                    add_token_with_context(&tok, &mut parts);
                }
            },
            NodeOrToken::Node(n) => match n.kind() {
                SyntaxKind::GUARD_CLAUSE => {
                    parts.push(sp());
                    parts.push(walk_node(&n));
                }
                SyntaxKind::BLOCK => {
                    let body = walk_block_body(&n);
                    parts.push(body);
                }
                _ => {
                    parts.push(walk_node(&n));
                }
            },
        }
    }

    ir::concat(parts)
}

// ── Binary expression ────────────────────────────────────────────────

fn walk_binary_expr(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => {
                match tok.kind() {
                    SyntaxKind::NEWLINE => {}
                    // Range operator `..` has no surrounding spaces.
                    SyntaxKind::DOT_DOT => {
                        parts.push(ir::text(".."));
                    }
                    _ if is_operator(tok.kind()) => {
                        parts.push(sp());
                        parts.push(ir::text(tok.text()));
                        parts.push(sp());
                    }
                    _ => {
                        add_token_with_context(&tok, &mut parts);
                    }
                }
            }
            NodeOrToken::Node(n) => {
                parts.push(walk_node(&n));
            }
        }
    }

    ir::concat(parts)
}

// ── Unary expression ────────────────────────────────────────────────

fn walk_unary_expr(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::NEWLINE => {}
                SyntaxKind::NOT_KW => {
                    parts.push(ir::text("not"));
                    parts.push(sp());
                }
                SyntaxKind::MINUS => {
                    parts.push(ir::text("-"));
                }
                SyntaxKind::BANG => {
                    parts.push(ir::text("!"));
                }
                _ => {
                    add_token_with_context(&tok, &mut parts);
                }
            },
            NodeOrToken::Node(n) => {
                parts.push(walk_node(&n));
            }
        }
    }

    ir::concat(parts)
}

// ── Pipe expression ────────────────────────────────────────────────

fn walk_pipe_expr(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::PIPE => {
                    parts.push(ir::hardline());
                    parts.push(ir::text("|>"));
                    parts.push(sp());
                }
                SyntaxKind::NEWLINE => {}
                _ => {
                    add_token_with_context(&tok, &mut parts);
                }
            },
            NodeOrToken::Node(n) => {
                parts.push(walk_node(&n));
            }
        }
    }

    ir::indent(ir::concat(parts))
}

// ── Call expression ──────────────────────────────────────────────────

fn walk_call_expr(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::NEWLINE => {}
                _ => {
                    add_token_with_context(&tok, &mut parts);
                }
            },
            NodeOrToken::Node(n) => {
                parts.push(walk_node(&n));
            }
        }
    }

    ir::concat(parts)
}

// ── Block ─────────────────────────────────────────────────────────

fn walk_block(node: &SyntaxNode) -> FormatIR {
    walk_block_body(node)
}

/// Walk the children of a BLOCK node, producing statements separated by hardlines.
fn walk_block_body(node: &SyntaxNode) -> FormatIR {
    let mut stmts: Vec<FormatIR> = Vec::new();

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::NEWLINE => {}
                SyntaxKind::COMMENT | SyntaxKind::DOC_COMMENT | SyntaxKind::MODULE_DOC_COMMENT => {
                    stmts.push(ir::text(tok.text()));
                }
                _ => {
                    stmts.push(ir::text(tok.text()));
                }
            },
            NodeOrToken::Node(n) => {
                stmts.push(walk_node(&n));
            }
        }
    }

    if stmts.is_empty() {
        FormatIR::Empty
    } else {
        let mut parts = Vec::new();
        for (i, stmt) in stmts.into_iter().enumerate() {
            if i > 0 {
                parts.push(ir::hardline());
            }
            parts.push(stmt);
        }
        ir::concat(parts)
    }
}

// ── Parenthesized lists (param_list, arg_list, tuple_expr) ───────────

fn walk_paren_list(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::L_PAREN => {
                    parts.push(ir::text("("));
                }
                SyntaxKind::R_PAREN => {
                    parts.push(ir::text(")"));
                }
                SyntaxKind::COMMA => {
                    parts.push(ir::text(","));
                    // Suppress trailing space when the next non-trivia token is R_PAREN
                    // (i.e. trailing comma before closing paren).
                    let mut next = tok.next_sibling_or_token();
                    while let Some(ref sib) = next {
                        match sib {
                            NodeOrToken::Token(t)
                                if matches!(
                                    t.kind(),
                                    SyntaxKind::NEWLINE | SyntaxKind::WHITESPACE
                                ) =>
                            {
                                next = t.next_sibling_or_token();
                            }
                            _ => break,
                        }
                    }
                    let is_trailing = matches!(
                        next,
                        Some(NodeOrToken::Token(ref t)) if t.kind() == SyntaxKind::R_PAREN
                    );
                    if !is_trailing {
                        parts.push(ir::space());
                    }
                }
                SyntaxKind::NEWLINE => {}
                _ => {
                    add_token_with_context(&tok, &mut parts);
                }
            },
            NodeOrToken::Node(n) => {
                parts.push(walk_node(&n));
            }
        }
    }

    ir::group(ir::concat(parts))
}

// ── Block-structured definitions (module, actor, service, etc.) ──────

fn walk_block_def(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();
    let mut past_do = false;
    let mut inner_items: Vec<FormatIR> = Vec::new();

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::MODULE_KW
                | SyntaxKind::ACTOR_KW
                | SyntaxKind::SERVICE_KW
                | SyntaxKind::SUPERVISOR_KW
                | SyntaxKind::INTERFACE_KW
                | SyntaxKind::TYPE_KW => {
                    parts.push(ir::text(tok.text()));
                    parts.push(sp());
                }
                SyntaxKind::DO_KW => {
                    parts.push(sp());
                    parts.push(ir::text("do"));
                    past_do = true;
                }
                SyntaxKind::END_KW => {}
                SyntaxKind::NEWLINE => {}
                SyntaxKind::COMMENT | SyntaxKind::DOC_COMMENT | SyntaxKind::MODULE_DOC_COMMENT => {
                    if past_do {
                        inner_items.push(ir::text(tok.text()));
                    } else {
                        parts.push(sp());
                        parts.push(ir::text(tok.text()));
                    }
                }
                _ => {
                    if past_do {
                        inner_items.push(ir::text(tok.text()));
                    } else {
                        add_token_with_context(&tok, &mut parts);
                    }
                }
            },
            NodeOrToken::Node(n) => {
                if n.kind() == SyntaxKind::DERIVING_CLAUSE {
                    // Handled after "end" is emitted
                } else if !past_do {
                    match n.kind() {
                        SyntaxKind::NAME | SyntaxKind::GENERIC_PARAM_LIST => {
                            parts.push(walk_node(&n));
                        }
                        _ => {
                            parts.push(walk_node(&n));
                        }
                    }
                } else if n.kind() == SyntaxKind::BLOCK {
                    for block_child in n.children_with_tokens() {
                        match block_child {
                            NodeOrToken::Token(t) => match t.kind() {
                                SyntaxKind::NEWLINE => {}
                                SyntaxKind::COMMENT
                                | SyntaxKind::DOC_COMMENT
                                | SyntaxKind::MODULE_DOC_COMMENT => {
                                    inner_items.push(ir::text(t.text()));
                                }
                                _ => {}
                            },
                            NodeOrToken::Node(bn) => {
                                inner_items.push(walk_node(&bn));
                            }
                        }
                    }
                } else {
                    inner_items.push(walk_node(&n));
                }
            }
        }
    }

    if !inner_items.is_empty() {
        let mut body_parts = Vec::new();
        for (i, item) in inner_items.into_iter().enumerate() {
            if i > 0 {
                body_parts.push(ir::hardline());
            }
            body_parts.push(ir::hardline());
            body_parts.push(item);
        }
        parts.push(ir::indent(ir::concat(body_parts)));
    }
    parts.push(ir::hardline());
    parts.push(ir::text("end"));

    // Emit deriving clause after "end" if present
    if let Some(dc) = node
        .children()
        .find(|n| n.kind() == SyntaxKind::DERIVING_CLAUSE)
    {
        parts.push(sp());
        parts.push(ir::text("deriving("));
        let traits: Vec<String> = dc
            .children_with_tokens()
            .filter_map(|it| it.into_token())
            .filter(|t| t.kind() == SyntaxKind::IDENT && t.text() != "deriving")
            .map(|t| t.text().to_string())
            .collect();
        parts.push(ir::text(&traits.join(", ")));
        parts.push(ir::text(")"));
    }

    ir::concat(parts)
}

fn normalize_child_spec_line(line: &str) -> Option<String> {
    let trimmed = line.trim();
    if trimmed.is_empty() {
        return None;
    }

    if trimmed == "end" {
        return Some("end".to_string());
    }

    if let Some(rest) = trimmed.strip_prefix("child") {
        let rest = rest.trim();
        if let Some(name) = rest.strip_suffix("do") {
            let name = name.trim();
            if !name.is_empty() {
                return Some(format!("child {name} do"));
            }
        }
        return Some(trimmed.to_string());
    }

    if let Some((key, value)) = trimmed.split_once(':') {
        return Some(format!("{}: {}", key.trim(), value.trim()));
    }

    Some(trimmed.to_string())
}

fn walk_child_spec_def(node: &SyntaxNode) -> FormatIR {
    let text = node.text().to_string();
    let lines: Vec<String> = text.lines().filter_map(normalize_child_spec_line).collect();

    if lines.is_empty() {
        return FormatIR::Empty;
    }

    let header = ir::text(&lines[0]);
    let end_line = lines
        .last()
        .cloned()
        .unwrap_or_else(|| "end".to_string());
    let body_lines = if lines.len() > 2 {
        lines[1..lines.len() - 1].to_vec()
    } else {
        Vec::new()
    };

    let mut parts = vec![header];
    if !body_lines.is_empty() {
        let mut body_parts = Vec::new();
        for line in body_lines {
            body_parts.push(ir::hardline());
            body_parts.push(ir::text(&line));
        }
        parts.push(ir::indent(ir::concat(body_parts)));
    }
    parts.push(ir::hardline());
    parts.push(ir::text(&end_line));
    ir::concat(parts)
}

// ── Struct definition ─────────────────────────────────────────────────

fn walk_struct_def(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();
    let mut fields: Vec<FormatIR> = Vec::new();
    let mut in_body = false;

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::STRUCT_KW => {
                    parts.push(ir::text("struct"));
                    parts.push(sp());
                }
                SyntaxKind::DO_KW => {
                    parts.push(sp());
                    parts.push(ir::text("do"));
                    in_body = true;
                }
                SyntaxKind::END_KW => {}
                SyntaxKind::NEWLINE => {}
                SyntaxKind::COMMENT | SyntaxKind::DOC_COMMENT => {
                    if in_body {
                        fields.push(ir::text(tok.text()));
                    } else {
                        parts.push(ir::text(tok.text()));
                    }
                }
                _ => {
                    add_token_with_context(&tok, &mut parts);
                }
            },
            NodeOrToken::Node(n) => {
                if n.kind() == SyntaxKind::DERIVING_CLAUSE {
                    // Handled after "end" is emitted
                } else if in_body || n.kind() == SyntaxKind::STRUCT_FIELD {
                    fields.push(walk_node(&n));
                } else {
                    match n.kind() {
                        SyntaxKind::VISIBILITY => {
                            parts.push(walk_node(&n));
                            parts.push(sp());
                        }
                        SyntaxKind::NAME | SyntaxKind::GENERIC_PARAM_LIST => {
                            parts.push(walk_node(&n));
                        }
                        _ => {
                            parts.push(walk_node(&n));
                        }
                    }
                }
            }
        }
    }

    if !fields.is_empty() {
        let mut field_parts = Vec::new();
        for field in fields {
            field_parts.push(ir::hardline());
            field_parts.push(field);
        }
        parts.push(ir::indent(ir::concat(field_parts)));
    }
    parts.push(ir::hardline());
    parts.push(ir::text("end"));

    // Emit deriving clause after "end" if present
    if let Some(dc) = node
        .children()
        .find(|n| n.kind() == SyntaxKind::DERIVING_CLAUSE)
    {
        parts.push(sp());
        parts.push(ir::text("deriving("));
        let traits: Vec<String> = dc
            .children_with_tokens()
            .filter_map(|it| it.into_token())
            .filter(|t| t.kind() == SyntaxKind::IDENT && t.text() != "deriving")
            .map(|t| t.text().to_string())
            .collect();
        parts.push(ir::text(&traits.join(", ")));
        parts.push(ir::text(")"));
    }

    ir::concat(parts)
}

fn walk_struct_field(node: &SyntaxNode) -> FormatIR {
    walk_tokens_inline(node)
}

// ── Closure expression ────────────────────────────────────────────────

fn walk_closure_expr(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();

    // Detect whether this closure uses do/end body form.
    let has_do = node
        .children_with_tokens()
        .any(|c| c.kind() == SyntaxKind::DO_KW);

    // Detect whether this is a multi-clause closure (has CLOSURE_CLAUSE children).
    let _has_clauses = node
        .children()
        .any(|c| c.kind() == SyntaxKind::CLOSURE_CLAUSE);

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => {
                match tok.kind() {
                    SyntaxKind::FN_KW => {
                        parts.push(ir::text("fn"));
                        // Add space before params (or before do/arrow if no params).
                        // The space is needed before PARAM_LIST, GUARD_CLAUSE, ARROW, DO_KW, etc.
                        parts.push(sp());
                    }
                    SyntaxKind::ARROW => {
                        // For multi-clause closures, subsequent clauses have their
                        // own ARROW inside CLOSURE_CLAUSE -- this is the first clause's arrow.
                        parts.push(ir::text("->"));
                        parts.push(sp());
                    }
                    SyntaxKind::END_KW => {
                        if has_do {
                            // do/end closures: end is on its own line for multi-stmt,
                            // or with a space for single-stmt.
                            // (Handled by the BLOCK formatting below.)
                        } else {
                            parts.push(sp());
                        }
                        parts.push(ir::text("end"));
                    }
                    SyntaxKind::DO_KW => {
                        parts.push(ir::text("do"));
                    }
                    SyntaxKind::NEWLINE => {}
                    SyntaxKind::BAR => {
                        // BAR between inline first clause and a CLOSURE_CLAUSE
                        // is handled by the CLOSURE_CLAUSE formatter; skip here.
                    }
                    _ => {
                        add_token_with_context(&tok, &mut parts);
                    }
                }
            }
            NodeOrToken::Node(n) => {
                match n.kind() {
                    SyntaxKind::PARAM_LIST => {
                        // Check if this is a bare param list (no parens) or parenthesized.
                        let has_parens = n
                            .children_with_tokens()
                            .any(|c| c.kind() == SyntaxKind::L_PAREN);
                        if has_parens {
                            // Parenthesized: use standard paren list formatting.
                            parts.push(walk_paren_list(&n));
                            parts.push(sp());
                        } else {
                            // Bare params: walk inline (params separated by ", ").
                            parts.push(walk_bare_param_list(&n));
                            parts.push(sp());
                        }
                    }
                    SyntaxKind::GUARD_CLAUSE => {
                        parts.push(walk_node(&n));
                        parts.push(sp());
                    }
                    SyntaxKind::BLOCK if has_do => {
                        // do/end body: indent multi-statement blocks.
                        let stmt_count = count_block_stmts(&n);
                        if stmt_count > 1 {
                            let body = walk_block_body(&n);
                            parts.push(ir::indent(ir::concat(vec![ir::hardline(), body])));
                            parts.push(ir::hardline());
                        } else {
                            parts.push(sp());
                            let body = walk_block_body(&n);
                            parts.push(body);
                            parts.push(sp());
                        }
                    }
                    SyntaxKind::BLOCK => {
                        // Arrow body: single expression inline.
                        let body = walk_block_body(&n);
                        parts.push(body);
                    }
                    SyntaxKind::CLOSURE_CLAUSE => {
                        parts.push(walk_closure_clause(&n));
                    }
                    _ => {
                        parts.push(walk_node(&n));
                    }
                }
            }
        }
    }

    ir::concat(parts)
}

/// Walk a CLOSURE_CLAUSE node (2nd+ clause in multi-clause closures).
fn walk_closure_clause(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::BAR => {
                    parts.push(ir::text("|"));
                    parts.push(sp());
                }
                SyntaxKind::ARROW => {
                    parts.push(ir::text("->"));
                    parts.push(sp());
                }
                SyntaxKind::NEWLINE => {}
                _ => {
                    add_token_with_context(&tok, &mut parts);
                }
            },
            NodeOrToken::Node(n) => match n.kind() {
                SyntaxKind::PARAM_LIST => {
                    let has_parens = n
                        .children_with_tokens()
                        .any(|c| c.kind() == SyntaxKind::L_PAREN);
                    if has_parens {
                        parts.push(walk_paren_list(&n));
                        parts.push(sp());
                    } else {
                        parts.push(walk_bare_param_list(&n));
                        parts.push(sp());
                    }
                }
                SyntaxKind::GUARD_CLAUSE => {
                    parts.push(walk_node(&n));
                    parts.push(sp());
                }
                SyntaxKind::BLOCK => {
                    let body = walk_block_body(&n);
                    parts.push(body);
                }
                _ => {
                    parts.push(walk_node(&n));
                }
            },
        }
    }

    ir::concat(parts)
}

/// Walk a bare (unparenthesized) PARAM_LIST, formatting params with ", " separators.
fn walk_bare_param_list(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::COMMA => {
                    parts.push(ir::text(","));
                    parts.push(sp());
                }
                SyntaxKind::NEWLINE => {}
                _ => {
                    add_token_with_context(&tok, &mut parts);
                }
            },
            NodeOrToken::Node(n) => {
                parts.push(walk_node(&n));
            }
        }
    }

    ir::concat(parts)
}

// ── Return expression ────────────────────────────────────────────────

fn walk_return_expr(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::RETURN_KW => {
                    parts.push(ir::text("return"));
                }
                SyntaxKind::NEWLINE => {}
                _ => {
                    add_token_with_context(&tok, &mut parts);
                }
            },
            NodeOrToken::Node(n) => {
                parts.push(sp());
                parts.push(walk_node(&n));
            }
        }
    }

    ir::concat(parts)
}

// ── Import declarations ──────────────────────────────────────────────

fn walk_import_decl(node: &SyntaxNode) -> FormatIR {
    walk_tokens_inline(node)
}

fn walk_path(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::EOF | SyntaxKind::NEWLINE => {}
                SyntaxKind::COMMENT | SyntaxKind::DOC_COMMENT | SyntaxKind::MODULE_DOC_COMMENT => {
                    if !parts.is_empty() {
                        parts.push(sp());
                    }
                    parts.push(ir::text(tok.text()));
                }
                _ => {
                    parts.push(ir::text(tok.text()));
                }
            },
            NodeOrToken::Node(n) => {
                parts.push(walk_node(&n));
            }
        }
    }

    ir::concat(parts)
}

fn walk_import_list(node: &SyntaxNode) -> FormatIR {
    // Check whether this import list is wrapped in parens.
    let has_parens = node.children_with_tokens().any(|child| {
        matches!(child, NodeOrToken::Token(ref tok) if tok.kind() == SyntaxKind::L_PAREN)
    });

    if !has_parens {
        // Non-parenthesized: inline formatting (e.g. "sqrt, pow")
        return walk_tokens_inline(node);
    }

    // Parenthesized: collect name parts and emit one per indented line.
    let mut names: Vec<FormatIR> = Vec::new();
    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::L_PAREN | SyntaxKind::R_PAREN => {}
                SyntaxKind::COMMA | SyntaxKind::NEWLINE => {}
                _ => {
                    names.push(ir::text(tok.text()));
                }
            },
            NodeOrToken::Node(n) => {
                names.push(walk_node(&n));
            }
        }
    }

    // Emit: "(\n  name1,\n  name2\n)"
    let mut inner_parts = Vec::new();
    inner_parts.push(ir::hardline());
    for (i, name) in names.iter().enumerate() {
        inner_parts.push(name.clone());
        if i < names.len() - 1 {
            inner_parts.push(ir::text(","));
            inner_parts.push(ir::hardline());
        }
    }

    let mut parts = Vec::new();
    parts.push(ir::text("("));
    parts.push(ir::indent(ir::concat(inner_parts)));
    parts.push(ir::hardline());
    parts.push(ir::text(")"));

    ir::concat(parts)
}

fn walk_from_import_decl(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::IDENT => {
                    if tok.text() == "from" {
                        parts.push(ir::text("from"));
                        parts.push(sp());
                    } else {
                        parts.push(ir::text(tok.text()));
                    }
                }
                SyntaxKind::IMPORT_KW => {
                    parts.push(sp());
                    parts.push(ir::text("import"));
                    parts.push(sp());
                }
                SyntaxKind::NEWLINE => {}
                _ => {
                    add_token_with_context(&tok, &mut parts);
                }
            },
            NodeOrToken::Node(n) => {
                parts.push(walk_node(&n));
            }
        }
    }

    ir::concat(parts)
}

// ── String expression ────────────────────────────────────────────────

fn walk_string_expr(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::NEWLINE => {}
                _ => {
                    parts.push(ir::text(tok.text()));
                }
            },
            NodeOrToken::Node(n) => {
                parts.push(walk_string_interpolation(&n));
            }
        }
    }

    ir::concat(parts)
}

fn walk_string_interpolation(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::NEWLINE => {}
                _ => {
                    parts.push(ir::text(tok.text()));
                }
            },
            NodeOrToken::Node(n) => {
                parts.push(walk_node(&n));
            }
        }
    }

    ir::concat(parts)
}

// ── Field access ────────────────────────────────────────────────────

fn walk_field_access(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::DOT => {
                    parts.push(ir::text("."));
                }
                SyntaxKind::NEWLINE => {}
                _ => {
                    parts.push(ir::text(tok.text()));
                }
            },
            NodeOrToken::Node(n) => {
                parts.push(walk_node(&n));
            }
        }
    }

    ir::concat(parts)
}

// ── Index expression ────────────────────────────────────────────────

fn walk_index_expr(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::L_BRACKET => parts.push(ir::text("[")),
                SyntaxKind::R_BRACKET => parts.push(ir::text("]")),
                SyntaxKind::NEWLINE => {}
                _ => {
                    parts.push(ir::text(tok.text()));
                }
            },
            NodeOrToken::Node(n) => {
                parts.push(walk_node(&n));
            }
        }
    }

    ir::concat(parts)
}

// ── Impl definition ──────────────────────────────────────────────────

fn walk_impl_def(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();
    let mut has_block = false;

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::IMPL_KW => {
                    parts.push(ir::text("impl"));
                    parts.push(sp());
                }
                SyntaxKind::FOR_KW => {
                    parts.push(sp());
                    parts.push(ir::text("for"));
                    parts.push(sp());
                }
                SyntaxKind::DO_KW => {
                    parts.push(sp());
                    parts.push(ir::text("do"));
                    has_block = true;
                }
                SyntaxKind::END_KW => {}
                SyntaxKind::NEWLINE => {}
                SyntaxKind::IDENT => {
                    parts.push(ir::text(tok.text()));
                }
                _ => {
                    add_token_with_context(&tok, &mut parts);
                }
            },
            NodeOrToken::Node(n) => match n.kind() {
                SyntaxKind::BLOCK if has_block => {
                    let body = walk_block_inner_items(&n);
                    parts.push(ir::indent(body));
                    parts.push(ir::hardline());
                    parts.push(ir::text("end"));
                }
                SyntaxKind::NAME => {
                    parts.push(walk_node(&n));
                }
                SyntaxKind::GENERIC_PARAM_LIST | SyntaxKind::GENERIC_ARG_LIST => {
                    parts.push(walk_node(&n));
                }
                _ => {
                    parts.push(walk_node(&n));
                }
            },
        }
    }

    if !has_block {
        parts.push(ir::hardline());
        parts.push(ir::text("end"));
    }

    ir::concat(parts)
}

// ── Type alias ──────────────────────────────────────────────────────

fn walk_type_alias_def(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::TYPE_KW => {
                    parts.push(ir::text("type"));
                    parts.push(sp());
                }
                SyntaxKind::EQ => {
                    parts.push(sp());
                    parts.push(ir::text("="));
                    parts.push(sp());
                }
                SyntaxKind::NEWLINE => {}
                _ => {
                    parts.push(ir::text(tok.text()));
                }
            },
            NodeOrToken::Node(n) => match n.kind() {
                SyntaxKind::VISIBILITY => {
                    parts.push(walk_node(&n));
                    parts.push(sp());
                }
                _ => {
                    parts.push(walk_node(&n));
                }
            },
        }
    }

    ir::concat(parts)
}

// ── Variant definition ──────────────────────────────────────────────

fn walk_variant_def(node: &SyntaxNode) -> FormatIR {
    walk_tokens_inline(node)
}

// ── Receive expression ──────────────────────────────────────────────

fn walk_receive_expr(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();
    let mut arms: Vec<FormatIR> = Vec::new();

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::RECEIVE_KW => {
                    parts.push(ir::text("receive"));
                }
                SyntaxKind::DO_KW => {
                    parts.push(sp());
                    parts.push(ir::text("do"));
                }
                SyntaxKind::END_KW => {}
                SyntaxKind::NEWLINE => {}
                _ => {
                    add_token_with_context(&tok, &mut parts);
                }
            },
            NodeOrToken::Node(n) => match n.kind() {
                SyntaxKind::RECEIVE_ARM => {
                    arms.push(walk_node(&n));
                }
                SyntaxKind::AFTER_CLAUSE => {
                    arms.push(walk_node(&n));
                }
                _ => {
                    parts.push(walk_node(&n));
                }
            },
        }
    }

    if !arms.is_empty() {
        let mut arm_parts = Vec::new();
        for arm in arms {
            arm_parts.push(ir::hardline());
            arm_parts.push(arm);
        }
        parts.push(ir::indent(ir::concat(arm_parts)));
    }

    parts.push(ir::hardline());
    parts.push(ir::text("end"));

    ir::concat(parts)
}

// ── Spawn/Send/Link expressions ──────────────────────────────────────

fn walk_spawn_send_link(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::SPAWN_KW | SyntaxKind::SEND_KW | SyntaxKind::LINK_KW => {
                    parts.push(ir::text(tok.text()));
                }
                SyntaxKind::L_PAREN => parts.push(ir::text("(")),
                SyntaxKind::R_PAREN => parts.push(ir::text(")")),
                SyntaxKind::COMMA => {
                    parts.push(ir::text(","));
                    parts.push(sp());
                }
                SyntaxKind::NEWLINE => {}
                _ => {
                    parts.push(ir::text(tok.text()));
                }
            },
            NodeOrToken::Node(n) => {
                parts.push(walk_node(&n));
            }
        }
    }

    ir::concat(parts)
}

// ── Self expression ──────────────────────────────────────────────────

fn walk_self_expr(node: &SyntaxNode) -> FormatIR {
    walk_tokens_inline(node)
}

// ── Call handler ──────────────────────────────────────────────────────

fn walk_call_handler(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::CALL_KW => {
                    parts.push(ir::text("call"));
                    parts.push(sp());
                }
                SyntaxKind::DO_KW => {
                    parts.push(sp());
                    parts.push(ir::text("do"));
                }
                SyntaxKind::END_KW => {}
                SyntaxKind::NEWLINE => {}
                _ => {
                    add_token_with_context(&tok, &mut parts);
                }
            },
            NodeOrToken::Node(n) => match n.kind() {
                SyntaxKind::BLOCK => {
                    let body = walk_block_body(&n);
                    parts.push(ir::indent(ir::concat(vec![ir::hardline(), body])));
                    parts.push(ir::hardline());
                    parts.push(ir::text("end"));
                }
                SyntaxKind::PARAM_LIST => {
                    parts.push(walk_node(&n));
                }
                SyntaxKind::TYPE_ANNOTATION => {
                    parts.push(sp());
                    parts.push(walk_node(&n));
                }
                SyntaxKind::NAME => {
                    parts.push(walk_node(&n));
                }
                _ => {
                    parts.push(walk_node(&n));
                }
            },
        }
    }

    ir::concat(parts)
}

// ── Cast handler ──────────────────────────────────────────────────────

fn walk_cast_handler(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::CAST_KW => {
                    parts.push(ir::text("cast"));
                    parts.push(sp());
                }
                SyntaxKind::DO_KW => {
                    parts.push(sp());
                    parts.push(ir::text("do"));
                }
                SyntaxKind::END_KW => {}
                SyntaxKind::NEWLINE => {}
                _ => {
                    add_token_with_context(&tok, &mut parts);
                }
            },
            NodeOrToken::Node(n) => match n.kind() {
                SyntaxKind::BLOCK => {
                    let body = walk_block_body(&n);
                    parts.push(ir::indent(ir::concat(vec![ir::hardline(), body])));
                    parts.push(ir::hardline());
                    parts.push(ir::text("end"));
                }
                SyntaxKind::PARAM_LIST => {
                    parts.push(walk_node(&n));
                }
                SyntaxKind::NAME => {
                    parts.push(walk_node(&n));
                }
                _ => {
                    parts.push(walk_node(&n));
                }
            },
        }
    }

    ir::concat(parts)
}

// ── Terminate clause ──────────────────────────────────────────────────

fn walk_terminate_clause(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::TERMINATE_KW => {
                    parts.push(ir::text("terminate"));
                }
                SyntaxKind::DO_KW => {
                    parts.push(sp());
                    parts.push(ir::text("do"));
                }
                SyntaxKind::END_KW => {}
                SyntaxKind::NEWLINE => {}
                _ => {
                    add_token_with_context(&tok, &mut parts);
                }
            },
            NodeOrToken::Node(n) => match n.kind() {
                SyntaxKind::BLOCK => {
                    let body = walk_block_body(&n);
                    parts.push(ir::indent(ir::concat(vec![ir::hardline(), body])));
                    parts.push(ir::hardline());
                    parts.push(ir::text("end"));
                }
                _ => {
                    parts.push(walk_node(&n));
                }
            },
        }
    }

    ir::concat(parts)
}

// ── Struct literal ──────────────────────────────────────────────────

fn walk_struct_literal(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::L_BRACE => {
                    parts.push(ir::text(" {"));
                    parts.push(sp());
                }
                SyntaxKind::R_BRACE => {
                    parts.push(sp());
                    parts.push(ir::text("}"));
                }
                SyntaxKind::COMMA => {
                    parts.push(ir::text(","));
                    parts.push(sp());
                }
                SyntaxKind::NEWLINE => {}
                _ => {
                    parts.push(ir::text(tok.text()));
                }
            },
            NodeOrToken::Node(n) => {
                parts.push(walk_node(&n));
            }
        }
    }

    ir::group(ir::concat(parts))
}

// ── Map literal ─────────────────────────────────────────────────────

fn walk_map_literal(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();
    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::PERCENT => parts.push(ir::text("%")),
                SyntaxKind::L_BRACE => {
                    parts.push(ir::text("{"));
                }
                SyntaxKind::R_BRACE => {
                    parts.push(ir::text("}"));
                }
                SyntaxKind::COMMA => {
                    parts.push(ir::text(","));
                    parts.push(sp());
                }
                SyntaxKind::NEWLINE => {}
                _ => {
                    add_token_with_context(&tok, &mut parts);
                }
            },
            NodeOrToken::Node(n) => {
                parts.push(walk_node(&n));
            }
        }
    }
    ir::group(ir::concat(parts))
}

// ── Map entry ───────────────────────────────────────────────────────

fn walk_map_entry(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();
    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::FAT_ARROW => {
                    parts.push(sp());
                    parts.push(ir::text("=>"));
                    parts.push(sp());
                }
                SyntaxKind::NEWLINE => {}
                _ => {
                    add_token_with_context(&tok, &mut parts);
                }
            },
            NodeOrToken::Node(n) => {
                parts.push(walk_node(&n));
            }
        }
    }
    ir::concat(parts)
}

// ── List literal ────────────────────────────────────────────────────

fn walk_list_literal(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();
    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::L_BRACKET => parts.push(ir::text("[")),
                SyntaxKind::R_BRACKET => parts.push(ir::text("]")),
                SyntaxKind::COMMA => {
                    parts.push(ir::text(","));
                    parts.push(sp());
                }
                SyntaxKind::NEWLINE => {}
                _ => {
                    add_token_with_context(&tok, &mut parts);
                }
            },
            NodeOrToken::Node(n) => {
                parts.push(walk_node(&n));
            }
        }
    }
    ir::group(ir::concat(parts))
}

// ── Associated type binding ─────────────────────────────────────────

fn walk_assoc_type_binding(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();
    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::TYPE_KW => {
                    parts.push(ir::text("type"));
                    parts.push(sp());
                }
                SyntaxKind::EQ => {
                    parts.push(sp());
                    parts.push(ir::text("="));
                    parts.push(sp());
                }
                SyntaxKind::NEWLINE => {}
                _ => {
                    parts.push(ir::text(tok.text()));
                }
            },
            NodeOrToken::Node(n) => {
                parts.push(walk_node(&n));
            }
        }
    }
    ir::concat(parts)
}

// ── Walk block inner items ──────────────────────────────────────────

/// Walk the children of a BLOCK that contains items (fns, fields, etc.)
/// inside a module/actor/service/etc definition.
fn walk_block_inner_items(node: &SyntaxNode) -> FormatIR {
    let mut items: Vec<FormatIR> = Vec::new();

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => match tok.kind() {
                SyntaxKind::NEWLINE => {}
                SyntaxKind::COMMENT | SyntaxKind::DOC_COMMENT | SyntaxKind::MODULE_DOC_COMMENT => {
                    items.push(ir::text(tok.text()));
                }
                _ => {}
            },
            NodeOrToken::Node(n) => {
                items.push(walk_node(&n));
            }
        }
    }

    if items.is_empty() {
        FormatIR::Empty
    } else {
        let mut parts = Vec::new();
        for (i, item) in items.into_iter().enumerate() {
            if i > 0 {
                parts.push(ir::hardline());
            }
            parts.push(ir::hardline());
            parts.push(item);
        }
        ir::concat(parts)
    }
}

// ── Helper: walk tokens inline with smart spacing ────────────────────

/// Walk all tokens in a node, emitting them with appropriate spacing.
fn walk_tokens_inline(node: &SyntaxNode) -> FormatIR {
    let mut parts = Vec::new();

    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => {
                let kind = tok.kind();
                if kind == SyntaxKind::EOF || kind == SyntaxKind::NEWLINE {
                    continue;
                }
                if kind == SyntaxKind::COMMENT
                    || kind == SyntaxKind::DOC_COMMENT
                    || kind == SyntaxKind::MODULE_DOC_COMMENT
                {
                    if !parts.is_empty() {
                        parts.push(sp());
                    }
                    parts.push(ir::text(tok.text()));
                    continue;
                }
                if !parts.is_empty() && needs_space_before(tok.kind()) {
                    parts.push(sp());
                }
                parts.push(ir::text(tok.text()));
            }
            NodeOrToken::Node(n) => {
                if !parts.is_empty() && needs_space_before_node(n.kind()) {
                    parts.push(sp());
                }
                parts.push(walk_node(&n));
            }
        }
    }

    ir::concat(parts)
}

// ── Spacing helpers ──────────────────────────────────────────────────

/// Check if a token kind should be preceded by a space when following another token.
fn needs_space_before(kind: SyntaxKind) -> bool {
    !matches!(
        kind,
        SyntaxKind::L_PAREN
            | SyntaxKind::R_PAREN
            | SyntaxKind::L_BRACKET
            | SyntaxKind::R_BRACKET
            | SyntaxKind::COMMA
            | SyntaxKind::DOT
            | SyntaxKind::COLON_COLON
            | SyntaxKind::STRING_START
            | SyntaxKind::STRING_END
            | SyntaxKind::STRING_CONTENT
            | SyntaxKind::INTERPOLATION_START
            | SyntaxKind::INTERPOLATION_END
    )
}

/// Check if a node kind should be preceded by a space.
fn needs_space_before_node(kind: SyntaxKind) -> bool {
    !matches!(
        kind,
        SyntaxKind::PARAM_LIST | SyntaxKind::ARG_LIST | SyntaxKind::GENERIC_PARAM_LIST
    )
}

/// Check if a SyntaxKind is an operator token.
fn is_operator(kind: SyntaxKind) -> bool {
    matches!(
        kind,
        SyntaxKind::PLUS
            | SyntaxKind::MINUS
            | SyntaxKind::STAR
            | SyntaxKind::SLASH
            | SyntaxKind::PERCENT
            | SyntaxKind::EQ_EQ
            | SyntaxKind::NOT_EQ
            | SyntaxKind::LT
            | SyntaxKind::GT
            | SyntaxKind::LT_EQ
            | SyntaxKind::GT_EQ
            | SyntaxKind::AMP_AMP
            | SyntaxKind::PIPE_PIPE
            | SyntaxKind::PIPE
            | SyntaxKind::DOT_DOT
            | SyntaxKind::DIAMOND
            | SyntaxKind::PLUS_PLUS
            | SyntaxKind::AND_KW
            | SyntaxKind::OR_KW
    )
}

/// Add a token to parts.
fn add_token_with_context(tok: &SyntaxToken, parts: &mut Vec<FormatIR>) {
    let kind = tok.kind();
    if kind == SyntaxKind::EOF || kind == SyntaxKind::NEWLINE {
        return;
    }
    if kind == SyntaxKind::COMMENT
        || kind == SyntaxKind::DOC_COMMENT
        || kind == SyntaxKind::MODULE_DOC_COMMENT
    {
        if !parts.is_empty() {
            parts.push(sp());
        }
        parts.push(ir::text(tok.text()));
        return;
    }
    parts.push(ir::text(tok.text()));
}

/// Count non-trivia children (statements) in a block.
fn count_block_stmts(node: &SyntaxNode) -> usize {
    let mut count = 0;
    for child in node.children_with_tokens() {
        match child {
            NodeOrToken::Token(tok) => {
                if !tok.kind().is_trivia() && tok.kind() != SyntaxKind::EOF {
                    count += 1;
                }
            }
            NodeOrToken::Node(_) => {
                count += 1;
            }
        }
    }
    count
}

#[cfg(test)]
mod tests {
    use crate::format_source;
    use crate::printer::FormatConfig;

    fn fmt(source: &str) -> String {
        format_source(source, &FormatConfig::default())
    }

    #[test]
    fn simple_let_binding() {
        let result = fmt("let x = 1");
        assert_eq!(result, "let x = 1\n");
    }

    #[test]
    fn fn_def_with_body() {
        let result = fmt("fn add(a, b) do\na + b\nend");
        assert_eq!(result, "fn add(a, b) do\n  a + b\nend\n");
    }

    #[test]
    fn fn_def_multiple_statements() {
        let result = fmt("fn foo(x) do\nlet y = x + 1\ny\nend");
        assert_eq!(result, "fn foo(x) do\n  let y = x + 1\n  y\nend\n");
    }

    #[test]
    fn if_else_expression() {
        let result = fmt("if x > 0 do\nx\nelse\n-x\nend");
        assert_eq!(result, "if x > 0 do\n  x\nelse\n  -x\nend\n");
    }

    #[test]
    fn case_expression() {
        let result = fmt("case x do\n1 -> \"one\"\n2 -> \"two\"\nend");
        assert_eq!(result, "case x do\n  1 -> \"one\"\n  2 -> \"two\"\nend\n");
    }

    #[test]
    fn comment_preserved() {
        let result = fmt("# This is a comment\nfn foo() do\n1\nend");
        assert!(result.contains("# This is a comment"));
    }

    #[test]
    fn idempotent_let() {
        let src = "let x = 1";
        let first = fmt(src);
        let second = fmt(&first);
        assert_eq!(
            first, second,
            "Idempotency failed.\nFirst: {:?}\nSecond: {:?}",
            first, second
        );
    }

    #[test]
    fn idempotent_fn_def() {
        let src = "fn add(a, b) do\na + b\nend";
        let first = fmt(src);
        let second = fmt(&first);
        assert_eq!(
            first, second,
            "Idempotency failed.\nFirst: {:?}\nSecond: {:?}",
            first, second
        );
    }

    #[test]
    fn idempotent_if_else() {
        let src = "if x > 0 do\nx\nelse\n-x\nend";
        let first = fmt(src);
        let second = fmt(&first);
        assert_eq!(
            first, second,
            "Idempotency failed.\nFirst: {:?}\nSecond: {:?}",
            first, second
        );
    }

    #[test]
    fn idempotent_case() {
        let src = "case x do\n1 -> \"one\"\n2 -> \"two\"\nend";
        let first = fmt(src);
        let second = fmt(&first);
        assert_eq!(
            first, second,
            "Idempotency failed.\nFirst: {:?}\nSecond: {:?}",
            first, second
        );
    }

    #[test]
    fn idempotent_module() {
        let src = "module Math do\nfn add(a, b) do\na + b\nend\nend";
        let first = fmt(src);
        let second = fmt(&first);
        assert_eq!(
            first, second,
            "Idempotency failed.\nFirst: {:?}\nSecond: {:?}",
            first, second
        );
    }

    #[test]
    fn struct_definition() {
        let result = fmt("struct Point do\nx :: Float\ny :: Float\nend");
        assert_eq!(result, "struct Point do\n  x :: Float\n  y :: Float\nend\n");
    }

    #[test]
    fn blank_line_between_top_level_items() {
        let result = fmt("fn foo() do\n1\nend\nfn bar() do\n2\nend");
        assert_eq!(result, "fn foo() do\n  1\nend\n\nfn bar() do\n  2\nend\n");
    }

    #[test]
    fn pipe_expression() {
        let result = fmt("x |> foo() |> bar()");
        assert!(result.contains("|>"));
        assert!(result.contains("foo()"));
        assert!(result.contains("bar()"));
    }

    #[test]
    fn call_with_args() {
        let result = fmt("foo(1, 2, 3)");
        assert_eq!(result, "foo(1, 2, 3)\n");
    }

    #[test]
    fn binary_expression() {
        let result = fmt("a + b");
        assert_eq!(result, "a + b\n");
    }

    #[test]
    fn from_import() {
        let result = fmt("from Math import sqrt, pow");
        assert_eq!(result, "from Math import sqrt, pow\n");
    }

    #[test]
    fn walk_path_preserves_dotted_import_and_impl_paths() {
        let single_line_import = fmt("from Api.Router import build_router");
        assert_eq!(single_line_import, "from Api.Router import build_router\n");

        let multiline_import = fmt("from Api.Router import (\nbuild_router,\nhealth_router\n)");
        assert_eq!(
            multiline_import,
            "from Api.Router import (\n  build_router,\n  health_router\n)\n"
        );

        let qualified_impl = fmt(
            "impl Foo.Bar for Baz.Qux do\nfn run(self) do\nself\nend\nend",
        );
        assert_eq!(
            qualified_impl,
            "impl Foo.Bar for Baz.Qux do\n  fn run(self) do\n    self\n  end\nend\n"
        );
    }

    #[test]
    fn let_with_type_annotation() {
        let result = fmt("let name :: String = \"hello\"");
        assert_eq!(result, "let name :: String = \"hello\"\n");
    }

    #[test]
    fn pub_type_alias() {
        let result = fmt("pub type UserId = Int");
        assert_eq!(result, "pub type UserId = Int\n");
    }

    #[test]
    fn idempotent_struct() {
        let src = "struct Point do\nx :: Float\ny :: Float\nend";
        let first = fmt(src);
        let second = fmt(&first);
        assert_eq!(
            first, second,
            "Idempotency failed.\nFirst: {:?}\nSecond: {:?}",
            first, second
        );
    }

    #[test]
    fn typed_fn_def() {
        let result = fmt("fn typed(x :: Int, y :: Int) -> Int do\nx + y\nend");
        assert_eq!(
            result,
            "fn typed(x :: Int, y :: Int) -> Int do\n  x + y\nend\n"
        );
    }

    #[test]
    fn fn_expr_body_form() {
        let result = fmt("fn double(x) = x * 2");
        assert_eq!(result, "fn double(x) = x * 2\n");
    }

    #[test]
    fn fn_expr_body_literal_pattern() {
        let result = fmt("fn fib(0) = 0");
        assert_eq!(result, "fn fib(0) = 0\n");
    }

    #[test]
    fn fn_expr_body_with_guard() {
        let result = fmt("fn abs(n) when n < 0 = -n");
        assert_eq!(result, "fn abs(n) when n < 0 = -n\n");
    }

    #[test]
    fn fn_expr_body_idempotent() {
        let src = "fn fib(0) = 0";
        let first = fmt(src);
        let second = fmt(&first);
        assert_eq!(
            first, second,
            "Idempotency failed.\nFirst: {:?}\nSecond: {:?}",
            first, second
        );
    }

    #[test]
    fn fn_expr_body_guard_idempotent() {
        let src = "fn abs(n) when n < 0 = -n";
        let first = fmt(src);
        let second = fmt(&first);
        assert_eq!(
            first, second,
            "Idempotency failed.\nFirst: {:?}\nSecond: {:?}",
            first, second
        );
    }

    #[test]
    fn multi_clause_fn_formatted() {
        let src = "fn fib(0) = 0\nfn fib(1) = 1\nfn fib(n) = fib(n - 1) + fib(n - 2)";
        let result = fmt(src);
        assert!(result.contains("fn fib(0) = 0"), "Result: {:?}", result);
        assert!(result.contains("fn fib(1) = 1"), "Result: {:?}", result);
        assert!(
            result.contains("fn fib(n) = fib(n - 1) + fib(n - 2)"),
            "Result: {:?}",
            result
        );
    }

    #[test]
    fn while_loop() {
        let result = fmt("while true do\nbreak\nend");
        assert_eq!(result, "while true do\n  break\nend\n");
    }

    #[test]
    fn while_loop_with_body() {
        let result = fmt("while x > 0 do\nprintln(x)\nend");
        assert_eq!(result, "while x > 0 do\n  println(x)\nend\n");
    }

    #[test]
    fn while_loop_idempotent() {
        let src = "while true do\nbreak\nend";
        let first = fmt(src);
        let second = fmt(&first);
        assert_eq!(
            first, second,
            "Idempotency failed.\nFirst: {:?}\nSecond: {:?}",
            first, second
        );
    }

    #[test]
    fn break_in_while() {
        let result = fmt("while true do\nbreak\nend");
        assert!(
            result.contains("break"),
            "Result should contain break: {:?}",
            result
        );
    }

    #[test]
    fn continue_in_while() {
        let result = fmt("while true do\ncontinue\nend");
        assert!(
            result.contains("continue"),
            "Result should contain continue: {:?}",
            result
        );
    }

    // ── For-in expression tests ─────────────────────────────────────

    #[test]
    fn for_in_range_basic() {
        let result = fmt("for i in 0..10 do\nprintln(i)\nend");
        assert_eq!(result, "for i in 0..10 do\n  println(i)\nend\n");
    }

    #[test]
    fn for_in_range_idempotent() {
        let src = "for i in 0..10 do\nprintln(i)\nend";
        let first = fmt(src);
        let second = fmt(&first);
        assert_eq!(
            first, second,
            "Idempotency failed.\nFirst: {:?}\nSecond: {:?}",
            first, second
        );
    }

    #[test]
    fn for_in_range_normalize_whitespace() {
        // Extra spaces should be normalized
        let result = fmt("for  i  in  0..10  do\nprintln(i)\nend");
        assert_eq!(result, "for i in 0..10 do\n  println(i)\nend\n");
    }

    #[test]
    fn for_in_destructure_binding() {
        // Map destructuring: for {k, v} in m do body end
        let result = fmt("for {k, v} in m do\nprintln(v)\nend");
        assert_eq!(result, "for {k, v} in m do\n  println(v)\nend\n");
    }

    #[test]
    fn for_in_destructure_binding_idempotent() {
        let src = "for {k, v} in m do\nprintln(v)\nend";
        let first = fmt(src);
        let second = fmt(&first);
        assert_eq!(
            first, second,
            "Idempotency failed.\nFirst: {:?}\nSecond: {:?}",
            first, second
        );
    }

    // ── For-in with when filter clause tests ──────────────────────────

    #[test]
    fn for_in_filter_basic() {
        let result = fmt("for x in list when x > 0 do\nx\nend");
        assert_eq!(result, "for x in list when x > 0 do\n  x\nend\n");
    }

    #[test]
    fn for_in_filter_basic_idempotent() {
        let src = "for x in list when x > 0 do\nx\nend";
        let first = fmt(src);
        let second = fmt(&first);
        assert_eq!(
            first, second,
            "Idempotency failed.\nFirst: {:?}\nSecond: {:?}",
            first, second
        );
    }

    #[test]
    fn for_in_filter_range() {
        let result = fmt("for i in 0..10 when i % 2 == 0 do\ni\nend");
        assert_eq!(result, "for i in 0..10 when i % 2 == 0 do\n  i\nend\n");
    }

    #[test]
    fn for_in_filter_range_idempotent() {
        let src = "for i in 0..10 when i % 2 == 0 do\ni\nend";
        let first = fmt(src);
        let second = fmt(&first);
        assert_eq!(
            first, second,
            "Idempotency failed.\nFirst: {:?}\nSecond: {:?}",
            first, second
        );
    }

    #[test]
    fn for_in_filter_destructure() {
        let result = fmt("for {k, v} in map when v > 0 do\nk\nend");
        assert_eq!(result, "for {k, v} in map when v > 0 do\n  k\nend\n");
    }

    #[test]
    fn for_in_filter_destructure_idempotent() {
        let src = "for {k, v} in map when v > 0 do\nk\nend";
        let first = fmt(src);
        let second = fmt(&first);
        assert_eq!(
            first, second,
            "Idempotency failed.\nFirst: {:?}\nSecond: {:?}",
            first, second
        );
    }

    #[test]
    fn map_literal_formatting() {
        let result = fmt("%{\"a\" => 1, \"b\" => 2}");
        assert!(result.contains("=>"), "Result: {:?}", result);
        assert!(result.contains("%{"), "Result: {:?}", result);
    }

    #[test]
    fn list_literal_formatting() {
        let result = fmt("[1, 2, 3]");
        assert_eq!(result, "[1, 2, 3]\n");
    }

    #[test]
    fn empty_list_literal() {
        let result = fmt("[]");
        assert_eq!(result, "[]\n");
    }

    #[test]
    fn empty_map_literal() {
        let result = fmt("%{}");
        assert_eq!(result, "%{}\n");
    }

    #[test]
    fn from_import_paren_single_line() {
        let result = fmt("from Math import (sqrt, pow)");
        assert_eq!(
            result,
            "from Math import (\n  sqrt,\n  pow\n)\n",
            "Parenthesized imports should format with one name per indented line"
        );
    }

    #[test]
    fn from_import_paren_multiline() {
        let result = fmt("from Math import (\n  sqrt,\n  pow\n)");
        assert_eq!(
            result,
            "from Math import (\n  sqrt,\n  pow\n)\n",
            "Multiline parenthesized imports should preserve structure"
        );
    }

    #[test]
    fn from_import_paren_trailing_comma() {
        let result = fmt("from Math import (\n  sqrt,\n  pow,\n)");
        assert_eq!(
            result,
            "from Math import (\n  sqrt,\n  pow\n)\n",
            "Trailing comma in parenthesized imports should be cleaned up"
        );
    }

    #[test]
    fn trailing_comma_arg_list() {
        let result = fmt("fn main() do\n  add(1, 2,)\nend");
        assert!(
            !result.contains(", )"),
            "Trailing comma before ) should not produce extra space. Got: {:?}",
            result
        );
        assert!(
            result.contains(",)"),
            "Trailing comma should be preserved but without space before ). Got: {:?}",
            result
        );
    }
}
