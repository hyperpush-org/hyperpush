//! Ariadne-based diagnostic rendering for type errors.
//!
//! Renders `TypeError` variants into formatted, labeled error messages
//! using the ariadne library. Output is terse (Go-minimal tone) with
//! dual-span labels showing expected vs found and fix suggestions when
//! a plausible fix exists (Elm-level thoroughness).
//!
//! Supports two output modes:
//! - **Human-readable** (default): colorized ariadne reports with multi-span labels
//! - **JSON** (via `--json`): one JSON object per line for editor/CI integration

use std::ops::Range;

use ariadne::{Color, Config, Label, Report, ReportKind};
use serde::Serialize;

use crate::error::{ConstraintOrigin, TypeError};
use crate::ty::Ty;

// ── Diagnostic Options ───────────────────────────────────────────────

/// Configuration for diagnostic rendering.
///
/// Controls color output (for terminal vs test/CI contexts) and output
/// format (human-readable vs machine-readable JSON).
#[derive(Clone, Debug)]
pub struct DiagnosticOptions {
    /// Whether to use ANSI color codes in output. Default: true.
    pub color: bool,
    /// Whether to output JSON format instead of human-readable. Default: false.
    pub json: bool,
}

impl Default for DiagnosticOptions {
    fn default() -> Self {
        Self {
            color: true,
            json: false,
        }
    }
}

impl DiagnosticOptions {
    /// Create options for colorless output (used in tests for deterministic snapshots).
    pub fn colorless() -> Self {
        Self {
            color: false,
            json: false,
        }
    }

    /// Create options for JSON output mode.
    pub fn json_mode() -> Self {
        Self {
            color: false,
            json: true,
        }
    }
}

// ── JSON Diagnostic Types ────────────────────────────────────────────

/// A single source span in a JSON diagnostic.
#[derive(Clone, Debug, Serialize)]
pub struct JsonSpan {
    pub start: usize,
    pub end: usize,
    pub label: String,
}

/// A machine-readable diagnostic in JSON format.
///
/// Produced one-per-line when `--json` flag is set. Designed for editor
/// integration and CI tooling.
#[derive(Clone, Debug, Serialize)]
pub struct JsonDiagnostic {
    pub code: String,
    pub severity: String,
    pub message: String,
    pub file: String,
    pub spans: Vec<JsonSpan>,
    pub fix: Option<String>,
}

// ── Error Codes ────────────────────────────────────────────────────────

/// Assign a unique error code to each TypeError variant.
fn error_code(err: &TypeError) -> &'static str {
    match err {
        TypeError::Mismatch { .. } => "E0001",
        TypeError::InfiniteType { .. } => "E0002",
        TypeError::ArityMismatch { .. } => "E0003",
        TypeError::UnboundVariable { .. } => "E0004",
        TypeError::NotAFunction { .. } => "E0005",
        TypeError::TraitNotSatisfied { .. } => "E0006",
        TypeError::MissingTraitMethod { .. } => "E0007",
        TypeError::TraitMethodSignatureMismatch { .. } => "E0008",
        TypeError::MissingField { .. }
        | TypeError::UnknownField { .. }
        | TypeError::NoSuchField { .. } => "E0009",
        TypeError::NoSuchMethod { .. } => "E0030",
        TypeError::UnknownVariant { .. } => "E0010",
        TypeError::OrPatternBindingMismatch { .. } => "E0011",
        TypeError::NonExhaustiveMatch { .. } => "E0012",
        TypeError::RedundantArm { .. } => "W0001",
        TypeError::InvalidGuardExpression { .. } => "E0013",
        TypeError::SendTypeMismatch { .. } => "E0014",
        TypeError::SelfOutsideActor { .. } => "E0015",
        TypeError::SpawnNonFunction { .. } => "E0016",
        TypeError::ReceiveOutsideActor { .. } => "E0017",
        TypeError::InvalidChildStart { .. } => "E0018",
        TypeError::InvalidStrategy { .. } => "E0019",
        TypeError::InvalidRestartType { .. } => "E0020",
        TypeError::InvalidShutdownValue { .. } => "E0021",
        TypeError::CatchAllNotLast { .. } => "E0022",
        TypeError::NonConsecutiveClauses { .. } => "E0023",
        TypeError::ClauseArityMismatch { .. } => "E0024",
        TypeError::NonFirstClauseAnnotation { .. } => "W0002",
        TypeError::GuardTypeMismatch { .. } => "E0025",
        TypeError::DuplicateImpl { .. } => "E0026",
        TypeError::AmbiguousMethod { .. } => "E0027",
        TypeError::UnsupportedDerive { .. } => "E0028",
        TypeError::MissingDerivePrerequisite { .. } => "E0029",
        TypeError::BreakOutsideLoop { .. } => "E0032",
        TypeError::ContinueOutsideLoop { .. } => "E0033",
        TypeError::ImportModuleNotFound { .. } => "E0031",
        TypeError::ImportNameNotFound { .. } => "E0034",
        TypeError::PrivateItem { .. } => "E0035",
        TypeError::TryIncompatibleReturn { .. } => "E0036",
        TypeError::TryOnNonResultOption { .. } => "E0037",
        TypeError::NonSerializableField { .. } => "E0038",
        TypeError::NonMappableField { .. } => "E0039",
        TypeError::MissingAssocType { .. } => "E0040",
        TypeError::ExtraAssocType { .. } => "E0041",
        TypeError::UnresolvedAssocType { .. } => "E0042",
        TypeError::SlotPositionConflict { .. } => "E0043",
        TypeError::SlotPipeOutOfRange { .. } => "E0044",
        TypeError::UndefinedType { .. } => "E0045",
    }
}

/// Determine severity string for JSON output.
fn severity(err: &TypeError) -> &'static str {
    match err {
        TypeError::RedundantArm { .. } => "warning",
        _ => "error",
    }
}

// ── Span Helpers ───────────────────────────────────────────────────────

/// Convert a rowan TextRange to a Rust Range<usize> for ariadne.
fn text_range_to_range(range: rowan::TextRange) -> Range<usize> {
    let start: usize = range.start().into();
    let end: usize = range.end().into();
    start..end
}

/// Extract a primary span from a ConstraintOrigin.
fn origin_span(origin: &ConstraintOrigin) -> Option<Range<usize>> {
    match origin {
        ConstraintOrigin::FnArg { call_site, .. } => Some(text_range_to_range(*call_site)),
        ConstraintOrigin::BinOp { op_span } => Some(text_range_to_range(*op_span)),
        ConstraintOrigin::IfBranches { if_span, .. } => Some(text_range_to_range(*if_span)),
        ConstraintOrigin::Annotation { annotation_span } => {
            Some(text_range_to_range(*annotation_span))
        }
        ConstraintOrigin::Return { return_span, .. } => Some(text_range_to_range(*return_span)),
        ConstraintOrigin::LetBinding { binding_span } => {
            Some(text_range_to_range(*binding_span))
        }
        ConstraintOrigin::Assignment { lhs_span, .. } => Some(text_range_to_range(*lhs_span)),
        ConstraintOrigin::Builtin => None,
    }
}

// ── Fix Suggestions ────────────────────────────────────────────────────

/// Generate a fix suggestion based on expected and found types.
fn fix_suggestion(expected: &Ty, found: &Ty) -> Option<String> {
    let exp_str = format!("{}", expected);
    let found_str = format!("{}", found);

    if exp_str.starts_with("Option<") {
        let inner = &exp_str[7..exp_str.len() - 1];
        if found_str == inner {
            return Some("wrap in Some(...)".to_string());
        }
    }

    if exp_str.starts_with("Result<") {
        if let Some(comma_pos) = exp_str.find(',') {
            let inner = &exp_str[7..comma_pos];
            if found_str == inner.trim() {
                return Some("wrap in Ok(...)".to_string());
            }
        }
    }

    if exp_str == "Int" && found_str == "Float" {
        return Some("use Int conversion".to_string());
    }
    if exp_str == "Float" && found_str == "Int" {
        return Some("use Float conversion".to_string());
    }
    if exp_str == "String" && found_str == "Int" {
        return Some("use to_string()".to_string());
    }
    if exp_str == "String" && found_str == "Float" {
        return Some("use to_string()".to_string());
    }
    if exp_str == "Bool" && found_str != "Bool" {
        return Some("expected a boolean expression".to_string());
    }

    None
}

/// Generate a fix suggestion for non-type-mismatch errors.
fn error_fix_suggestion(err: &TypeError, suggestions: Option<&[String]>) -> Option<String> {
    match err {
        TypeError::UnboundVariable { name, .. } => {
            if let Some(names) = suggestions {
                if let Some(closest) = find_closest_name(name, names, 2) {
                    return Some(format!("did you mean `{}`?", closest));
                }
            }
            None
        }
        TypeError::NotAFunction { .. } => {
            Some("did you mean to call it? Remove the argument list".to_string())
        }
        TypeError::UnknownVariant { name, .. } => {
            if let Some(variants) = suggestions {
                if let Some(closest) = find_closest_name(name, variants, 2) {
                    return Some(format!("did you mean `{}`?", closest));
                }
            }
            None
        }
        _ => None,
    }
}

/// Find the closest name in a list using Levenshtein distance.
fn find_closest_name(target: &str, candidates: &[String], max_distance: usize) -> Option<String> {
    let mut best: Option<(usize, &str)> = None;
    for candidate in candidates {
        let dist = levenshtein_distance(target, candidate);
        if dist <= max_distance {
            if let Some((best_dist, _)) = best {
                if dist < best_dist {
                    best = Some((dist, candidate));
                }
            } else {
                best = Some((dist, candidate));
            }
        }
    }
    best.map(|(_, name)| name.to_string())
}

/// Compute Levenshtein edit distance between two strings.
fn levenshtein_distance(a: &str, b: &str) -> usize {
    let a_chars: Vec<char> = a.chars().collect();
    let b_chars: Vec<char> = b.chars().collect();
    let m = a_chars.len();
    let n = b_chars.len();

    if m == 0 {
        return n;
    }
    if n == 0 {
        return m;
    }

    let mut prev = vec![0usize; n + 1];
    let mut curr = vec![0usize; n + 1];

    for j in 0..=n {
        prev[j] = j;
    }

    for i in 1..=m {
        curr[0] = i;
        for j in 1..=n {
            let cost = if a_chars[i - 1] == b_chars[j - 1] {
                0
            } else {
                1
            };
            curr[j] = (prev[j] + 1)
                .min(curr[j - 1] + 1)
                .min(prev[j - 1] + cost);
        }
        std::mem::swap(&mut prev, &mut curr);
    }

    prev[n]
}

// ── JSON Rendering ───────────────────────────────────────────────────

/// Render a type error as a JSON diagnostic string (one line).
///
/// Produces machine-readable output for editor/CI integration.
pub fn render_json_diagnostic(
    error: &TypeError,
    source: &str,
    filename: &str,
    suggestions: Option<&[String]>,
) -> String {
    let source_len = source.len();
    let code = error_code(error).to_string();
    let sev = severity(error).to_string();
    let message = format!("{}", error);

    let mut spans = Vec::new();
    let fix;

    match error {
        TypeError::Mismatch {
            expected,
            found,
            origin,
        } => {
            if let Some(span) = origin_span(origin) {
                let s = span.start.min(source_len);
                let e = span.end.min(source_len).max(s);
                spans.push(JsonSpan {
                    start: s,
                    end: e,
                    label: format!("expected {}, found {}", expected, found),
                });
            }
            match origin {
                ConstraintOrigin::IfBranches {
                    then_span,
                    else_span,
                    ..
                } => {
                    let tr = text_range_to_range(*then_span);
                    let er = text_range_to_range(*else_span);
                    spans.push(JsonSpan {
                        start: tr.start,
                        end: tr.end,
                        label: format!("expected {}", expected),
                    });
                    spans.push(JsonSpan {
                        start: er.start,
                        end: er.end,
                        label: format!("found {}", found),
                    });
                }
                ConstraintOrigin::Return {
                    return_span,
                    fn_span,
                } => {
                    let rr = text_range_to_range(*return_span);
                    let fr = text_range_to_range(*fn_span);
                    spans.push(JsonSpan {
                        start: rr.start,
                        end: rr.end,
                        label: "return expression here".to_string(),
                    });
                    spans.push(JsonSpan {
                        start: fr.start,
                        end: fr.end,
                        label: "return type declared here".to_string(),
                    });
                }
                ConstraintOrigin::Assignment { lhs_span, rhs_span } => {
                    let lr = text_range_to_range(*lhs_span);
                    let rr = text_range_to_range(*rhs_span);
                    spans.push(JsonSpan {
                        start: lr.start,
                        end: lr.end,
                        label: format!("expected {}", expected),
                    });
                    spans.push(JsonSpan {
                        start: rr.start,
                        end: rr.end,
                        label: format!("found {}", found),
                    });
                }
                _ => {}
            }
            fix = fix_suggestion(expected, found);
        }
        TypeError::UnboundVariable { span, .. } => {
            let range = text_range_to_range(*span);
            spans.push(JsonSpan {
                start: range.start,
                end: range.end,
                label: "not found in this scope".to_string(),
            });
            fix = error_fix_suggestion(error, suggestions);
        }
        TypeError::NotAFunction { span, .. } => {
            let range = text_range_to_range(*span);
            spans.push(JsonSpan {
                start: range.start,
                end: range.end,
                label: message.clone(),
            });
            fix = error_fix_suggestion(error, suggestions);
        }
        TypeError::UnknownVariant { span, .. } => {
            let range = text_range_to_range(*span);
            spans.push(JsonSpan {
                start: range.start,
                end: range.end,
                label: "not a known variant".to_string(),
            });
            fix = error_fix_suggestion(error, suggestions);
        }
        TypeError::InfiniteType { origin, .. } => {
            if let Some(span) = origin_span(origin) {
                spans.push(JsonSpan {
                    start: span.start,
                    end: span.end,
                    label: "recursive type here".to_string(),
                });
            }
            fix = Some("a value cannot have a type that refers to itself".to_string());
        }
        TypeError::ArityMismatch {
            expected: exp,
            found: fnd,
            origin,
        } => {
            if let Some(span) = origin_span(origin) {
                spans.push(JsonSpan {
                    start: span.start,
                    end: span.end,
                    label: format!("expected {} argument(s)", exp),
                });
            }
            fix = if *exp > *fnd {
                Some(format!("missing {} argument(s)", exp - fnd))
            } else {
                Some(format!("{} extra argument(s)", fnd - exp))
            };
        }
        TypeError::NonExhaustiveMatch {
            missing_patterns,
            span,
            ..
        } => {
            let range = text_range_to_range(*span);
            spans.push(JsonSpan {
                start: range.start,
                end: range.end,
                label: format!("missing: {}", missing_patterns.join(", ")),
            });
            fix = Some("add the missing patterns or a wildcard `_` arm".to_string());
        }
        TypeError::RedundantArm { span, .. } => {
            let range = text_range_to_range(*span);
            spans.push(JsonSpan {
                start: range.start,
                end: range.end,
                label: "this arm is unreachable".to_string(),
            });
            fix = Some("remove this arm or reorder the match".to_string());
        }
        _ => {
            fix = None;
            match error {
                TypeError::TraitNotSatisfied { origin, .. } => {
                    if let Some(span) = origin_span(origin) {
                        spans.push(JsonSpan {
                            start: span.start,
                            end: span.end,
                            label: message.clone(),
                        });
                    }
                }
                TypeError::MissingField { span, .. }
                | TypeError::UnknownField { span, .. }
                | TypeError::NoSuchField { span, .. }
                | TypeError::NoSuchMethod { span, .. }
                | TypeError::AmbiguousMethod { span, .. }
                | TypeError::OrPatternBindingMismatch { span, .. }
                | TypeError::InvalidGuardExpression { span, .. }
                | TypeError::SendTypeMismatch { span, .. }
                | TypeError::SelfOutsideActor { span }
                | TypeError::SpawnNonFunction { span, .. }
                | TypeError::ReceiveOutsideActor { span }
                | TypeError::InvalidChildStart { span, .. }
                | TypeError::InvalidStrategy { span, .. }
                | TypeError::InvalidRestartType { span, .. }
                | TypeError::InvalidShutdownValue { span, .. }
                | TypeError::BreakOutsideLoop { span }
                | TypeError::ContinueOutsideLoop { span }
                | TypeError::ImportModuleNotFound { span, .. }
                | TypeError::ImportNameNotFound { span, .. }
                | TypeError::PrivateItem { span, .. }
                | TypeError::TryIncompatibleReturn { span, .. }
                | TypeError::TryOnNonResultOption { span, .. }
                | TypeError::UnresolvedAssocType { span, .. }
                | TypeError::SlotPositionConflict { span, .. }
                | TypeError::SlotPipeOutOfRange { span, .. }
                | TypeError::UndefinedType { span, .. } => {
                    let range = text_range_to_range(*span);
                    spans.push(JsonSpan {
                        start: range.start,
                        end: range.end,
                        label: message.clone(),
                    });
                }
                _ => {
                    spans.push(JsonSpan {
                        start: 0,
                        end: source_len.max(1),
                        label: message.clone(),
                    });
                }
            }
        }
    }

    let diag = JsonDiagnostic {
        code,
        severity: sev,
        message,
        file: filename.to_string(),
        spans,
        fix,
    };

    serde_json::to_string(&diag).unwrap_or_else(|_| "{}".to_string())
}

// ── Main Rendering Function ────────────────────────────────────────────

/// Render a type error into a formatted diagnostic string using ariadne.
///
/// Accepts `DiagnosticOptions` to control color and output format.
/// When `options.json` is true, delegates to `render_json_diagnostic`.
/// When `options.color` is false, uses colorless config for deterministic
/// test snapshots.
///
/// The optional `suggestions` parameter provides names in scope for
/// "did you mean X?" suggestions on E0004/E0010 errors.
pub fn render_diagnostic(
    error: &TypeError,
    source: &str,
    filename: &str,
    options: &DiagnosticOptions,
    suggestions: Option<&[String]>,
) -> String {
    if options.json {
        return render_json_diagnostic(error, source, filename, suggestions);
    }

    let config = if options.color {
        Config::default()
    } else {
        Config::default().with_color(false)
    };
    let source_len = source.len();

    let clamp = |r: Range<usize>| -> Range<usize> {
        let s = r.start.min(source_len);
        let e = r.end.min(source_len).max(s);
        if s == e {
            s..e.saturating_add(1).min(source_len)
        } else {
            s..e
        }
    };

    let code = error_code(error);

    let fname = filename.to_string();

    let report = match error {
        TypeError::Mismatch {
            expected,
            found,
            origin,
        } => {
            let msg = format!("expected {}, found {}", expected, found);
            let span = origin_span(origin).unwrap_or(0..source_len.max(1).min(source_len));
            let span = clamp(span);

            let mut builder = Report::build(ReportKind::Error, (fname.clone(), span.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config);

            match origin {
                ConstraintOrigin::IfBranches {
                    then_span,
                    else_span,
                    ..
                } => {
                    let then_range = clamp(text_range_to_range(*then_span));
                    let else_range = clamp(text_range_to_range(*else_span));
                    builder.add_label(
                        Label::new((fname.clone(), then_range))
                            .with_message(format!("expected {}", expected))
                            .with_color(Color::Red),
                    );
                    builder.add_label(
                        Label::new((fname.clone(), else_range))
                            .with_message(format!("found {}", found))
                            .with_color(Color::Blue),
                    );
                }
                ConstraintOrigin::Annotation { annotation_span } => {
                    let ann_range = clamp(text_range_to_range(*annotation_span));
                    builder.add_label(
                        Label::new((fname.clone(), ann_range))
                            .with_message(format!("expected {} from annotation", expected))
                            .with_color(Color::Red),
                    );
                }
                ConstraintOrigin::FnArg {
                    call_site,
                    param_idx,
                } => {
                    let call_range = clamp(text_range_to_range(*call_site));
                    builder.add_label(
                        Label::new((fname.clone(), call_range))
                            .with_message(format!(
                                "argument {} has type {}, expected {}",
                                param_idx + 1,
                                found,
                                expected
                            ))
                            .with_color(Color::Red),
                    );
                }
                ConstraintOrigin::Return {
                    return_span,
                    fn_span,
                } => {
                    let ret_range = clamp(text_range_to_range(*return_span));
                    let fn_range = clamp(text_range_to_range(*fn_span));
                    builder.add_label(
                        Label::new((fname.clone(), ret_range))
                            .with_message(format!("returns {}", found))
                            .with_color(Color::Red),
                    );
                    builder.add_label(
                        Label::new((fname.clone(), fn_range))
                            .with_message(format!("return type declared as {}", expected))
                            .with_color(Color::Blue),
                    );
                }
                ConstraintOrigin::Assignment { lhs_span, rhs_span } => {
                    let lhs_range = clamp(text_range_to_range(*lhs_span));
                    let rhs_range = clamp(text_range_to_range(*rhs_span));
                    builder.add_label(
                        Label::new((fname.clone(), lhs_range))
                            .with_message(format!("expected {}", expected))
                            .with_color(Color::Red),
                    );
                    builder.add_label(
                        Label::new((fname.clone(), rhs_range))
                            .with_message(format!("found {}", found))
                            .with_color(Color::Blue),
                    );
                }
                _ => {
                    builder.add_label(
                        Label::new((fname.clone(), span.clone()))
                            .with_message(format!("expected {}, found {}", expected, found))
                            .with_color(Color::Red),
                    );
                }
            }

            if let Some(fix) = fix_suggestion(expected, found) {
                builder.set_help(fix);
            }

            builder.finish()
        }

        TypeError::InfiniteType { var, ty, origin } => {
            let msg = format!("infinite type: ?{} occurs in {}", var.0, ty);
            let span = origin_span(origin).unwrap_or(0..source_len.max(1).min(source_len));
            let span = clamp(span);

            Report::build(ReportKind::Error, (fname.clone(), span.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), span))
                        .with_message("recursive type here")
                        .with_color(Color::Red),
                )
                .with_help("a value cannot have a type that refers to itself")
                .finish()
        }

        TypeError::ArityMismatch {
            expected,
            found,
            origin,
        } => {
            let msg = format!("expected {} argument(s), found {}", expected, found);
            let span = origin_span(origin).unwrap_or(0..source_len.max(1).min(source_len));
            let span = clamp(span);

            let mut builder = Report::build(ReportKind::Error, (fname.clone(), span.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), span))
                        .with_message(format!("expected {} argument(s)", expected))
                        .with_color(Color::Red),
                );

            if *expected > *found {
                builder.set_help(format!("missing {} argument(s)", expected - found));
            } else {
                builder.set_help(format!("{} extra argument(s)", found - expected));
            }

            builder.finish()
        }

        TypeError::UnboundVariable { name, span } => {
            let msg = format!("undefined variable: {}", name);
            let range = clamp(text_range_to_range(*span));

            let mut builder = Report::build(ReportKind::Error, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message("not found in this scope")
                        .with_color(Color::Red),
                );

            if let Some(fix) = error_fix_suggestion(error, suggestions) {
                builder.set_help(fix);
            }

            builder.finish()
        }

        TypeError::NotAFunction { ty, span } => {
            let msg = format!("type {} is not callable", ty);
            let range = clamp(text_range_to_range(*span));

            let mut builder = Report::build(ReportKind::Error, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message(format!("{} is not a function", ty))
                        .with_color(Color::Red),
                );

            if let Some(fix) = error_fix_suggestion(error, None) {
                builder.set_help(fix);
            }

            builder.finish()
        }

        TypeError::TraitNotSatisfied {
            ty,
            trait_name,
            origin,
        } => {
            let msg = format!("{} does not implement {}", ty, trait_name);
            let span = origin_span(origin).unwrap_or(0..source_len.max(1).min(source_len));
            let span = clamp(span);

            Report::build(ReportKind::Error, (fname.clone(), span.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), span))
                        .with_message(format!("{} does not satisfy {}", ty, trait_name))
                        .with_color(Color::Red),
                )
                .with_help(format!("add `impl {} for {} do ... end`", trait_name, ty))
                .finish()
        }

        TypeError::MissingTraitMethod {
            trait_name,
            method_name,
            impl_ty,
        } => {
            let msg = format!(
                "impl {} for {} is missing method {}",
                trait_name, impl_ty, method_name
            );
            let span = clamp(0..source_len.max(1).min(source_len));

            Report::build(ReportKind::Error, (fname.clone(), span.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), span))
                        .with_message(format!("missing `{}`", method_name))
                        .with_color(Color::Red),
                )
                .with_help(format!(
                    "add `fn {}(self) ... end` to the impl block",
                    method_name
                ))
                .finish()
        }

        TypeError::TraitMethodSignatureMismatch {
            trait_name,
            method_name,
            expected,
            found,
        } => {
            let msg = format!(
                "method {} in impl {} has wrong signature: expected {}, found {}",
                method_name, trait_name, expected, found
            );
            let span = clamp(0..source_len.max(1).min(source_len));

            Report::build(ReportKind::Error, (fname.clone(), span.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), span))
                        .with_message(format!(
                            "expected return type {}, found {}",
                            expected, found
                        ))
                        .with_color(Color::Red),
                )
                .finish()
        }

        TypeError::MissingField {
            struct_name,
            field_name,
            span,
        } => {
            let msg = format!("missing field {} in struct {}", field_name, struct_name);
            let range = clamp(text_range_to_range(*span));

            Report::build(ReportKind::Error, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message(format!("field `{}` is required", field_name))
                        .with_color(Color::Red),
                )
                .with_help(format!("add `{}: <value>`", field_name))
                .finish()
        }

        TypeError::UnknownField {
            struct_name,
            field_name,
            span,
        } => {
            let msg = format!("unknown field {} in struct {}", field_name, struct_name);
            let range = clamp(text_range_to_range(*span));

            Report::build(ReportKind::Error, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message(format!("`{}` has no field `{}`", struct_name, field_name))
                        .with_color(Color::Red),
                )
                .finish()
        }

        TypeError::NoSuchField {
            ty,
            field_name,
            span,
        } => {
            let msg = format!("type {} has no field {}", ty, field_name);
            let range = clamp(text_range_to_range(*span));

            Report::build(ReportKind::Error, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message(format!("no field `{}`", field_name))
                        .with_color(Color::Red),
                )
                .finish()
        }

        TypeError::NoSuchMethod {
            ty,
            method_name,
            span,
        } => {
            let msg = format!("no method `{}` on type `{}`", method_name, ty);
            let range = clamp(text_range_to_range(*span));

            Report::build(ReportKind::Error, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message(format!("method `{}` not found", method_name))
                        .with_color(Color::Red),
                )
                .with_help(format!(
                    "type `{}` has no trait impl providing `{}`",
                    ty, method_name
                ))
                .finish()
        }

        TypeError::UnknownVariant { name, span } => {
            let msg = format!("unknown variant: {}", name);
            let range = clamp(text_range_to_range(*span));

            let mut builder = Report::build(ReportKind::Error, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message("not a known variant")
                        .with_color(Color::Red),
                );

            if let Some(fix) = error_fix_suggestion(error, suggestions) {
                builder.set_help(fix);
            }

            builder.finish()
        }

        TypeError::OrPatternBindingMismatch {
            expected_bindings,
            found_bindings,
            span,
        } => {
            let msg = format!(
                "or-pattern alternatives bind different variables: [{}] vs [{}]",
                expected_bindings.join(", "),
                found_bindings.join(", ")
            );
            let range = clamp(text_range_to_range(*span));

            Report::build(ReportKind::Error, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message("alternatives must bind the same variables")
                        .with_color(Color::Red),
                )
                .with_help(
                    "all alternatives in an or-pattern must bind the same set of variable names",
                )
                .finish()
        }

        TypeError::NonExhaustiveMatch {
            scrutinee_type,
            missing_patterns,
            span,
        } => {
            let msg = format!("non-exhaustive match on `{}`", scrutinee_type);
            let range = clamp(text_range_to_range(*span));

            Report::build(ReportKind::Error, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message(format!("missing: {}", missing_patterns.join(", ")))
                        .with_color(Color::Red),
                )
                .with_help("add the missing patterns or a wildcard `_` arm")
                .finish()
        }

        TypeError::RedundantArm { arm_index, span } => {
            let msg = format!("redundant match arm (arm {})", arm_index + 1);
            let range = clamp(text_range_to_range(*span));

            Report::build(ReportKind::Warning, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message("this arm is unreachable")
                        .with_color(Color::Yellow),
                )
                .with_help("remove this arm or reorder the match")
                .finish()
        }

        TypeError::InvalidGuardExpression { reason, span } => {
            let msg = format!("invalid guard: {}", reason);
            let range = clamp(text_range_to_range(*span));

            Report::build(ReportKind::Error, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message(
                            "only comparisons, boolean ops, literals, and names allowed",
                        )
                        .with_color(Color::Red),
                )
                .with_help("guards must be simple boolean expressions")
                .finish()
        }

        TypeError::SendTypeMismatch {
            expected,
            found,
            span,
        } => {
            let msg = format!(
                "message type mismatch: expected {}, found {}",
                expected, found
            );
            let range = clamp(text_range_to_range(*span));

            Report::build(ReportKind::Error, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message(format!("expected {}, found {}", expected, found))
                        .with_color(Color::Red),
                )
                .with_help(format!("this Pid accepts messages of type {}", expected))
                .finish()
        }

        TypeError::SelfOutsideActor { span } => {
            let msg = "self() used outside actor block";
            let range = clamp(text_range_to_range(*span));

            Report::build(ReportKind::Error, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message("self() is only available inside an actor block")
                        .with_color(Color::Red),
                )
                .finish()
        }

        TypeError::SpawnNonFunction { found, span } => {
            let msg = format!("cannot spawn non-function: found {}", found);
            let range = clamp(text_range_to_range(*span));

            Report::build(ReportKind::Error, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message(format!("expected a function, found {}", found))
                        .with_color(Color::Red),
                )
                .finish()
        }

        TypeError::ReceiveOutsideActor { span } => {
            let msg = "receive used outside actor block";
            let range = clamp(text_range_to_range(*span));

            Report::build(ReportKind::Error, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message("receive is only available inside an actor block")
                        .with_color(Color::Red),
                )
                .with_help("move this receive expression into an actor block")
                .finish()
        }

        TypeError::InvalidChildStart {
            child_name,
            found,
            span,
        } => {
            let msg = format!(
                "child `{}` start function must return Pid, found `{}`",
                child_name, found
            );
            let range = clamp(text_range_to_range(*span));

            Report::build(ReportKind::Error, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message(format!("expected Pid<M>, found {}", found))
                        .with_color(Color::Red),
                )
                .with_help("the start function must call spawn() and return a Pid")
                .finish()
        }

        TypeError::InvalidStrategy { found, span } => {
            let msg = format!("unknown supervision strategy `{}`", found);
            let range = clamp(text_range_to_range(*span));

            Report::build(ReportKind::Error, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message(
                            "expected one_for_one, one_for_all, rest_for_one, or simple_one_for_one",
                        )
                        .with_color(Color::Red),
                )
                .finish()
        }

        TypeError::InvalidRestartType {
            found,
            child_name,
            span,
        } => {
            let msg = format!(
                "invalid restart type `{}` for child `{}`",
                found, child_name
            );
            let range = clamp(text_range_to_range(*span));

            Report::build(ReportKind::Error, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message("expected permanent, transient, or temporary")
                        .with_color(Color::Red),
                )
                .finish()
        }

        TypeError::InvalidShutdownValue {
            found,
            child_name,
            span,
        } => {
            let msg = format!(
                "invalid shutdown value `{}` for child `{}`",
                found, child_name
            );
            let range = clamp(text_range_to_range(*span));

            Report::build(ReportKind::Error, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message("expected a positive integer or brutal_kill")
                        .with_color(Color::Red),
                )
                .finish()
        }

        // ── Multi-clause function diagnostics (11-02) ──────────────────
        TypeError::CatchAllNotLast {
            fn_name,
            arity,
            span,
        } => {
            let msg = format!(
                "catch-all clause must be the last clause of function `{}/{}`",
                fn_name, arity
            );
            let range = clamp(text_range_to_range(*span));

            Report::build(ReportKind::Error, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message("clauses after a catch-all are unreachable")
                        .with_color(Color::Red),
                )
                .finish()
        }
        TypeError::NonConsecutiveClauses {
            fn_name,
            arity,
            first_span,
            second_span,
        } => {
            let msg = format!(
                "function `{}/{}` already defined; multi-clause functions must have consecutive clauses",
                fn_name, arity
            );
            let range = clamp(text_range_to_range(*second_span));
            let first_range = clamp(text_range_to_range(*first_span));

            Report::build(ReportKind::Error, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), first_range))
                        .with_message("first definition here")
                        .with_color(Color::Blue),
                )
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message("non-consecutive redefinition here")
                        .with_color(Color::Red),
                )
                .finish()
        }
        TypeError::ClauseArityMismatch {
            fn_name,
            expected_arity,
            found_arity,
            span,
        } => {
            let msg = format!(
                "all clauses of `{}` must have the same number of parameters; expected {}, found {}",
                fn_name, expected_arity, found_arity
            );
            let range = clamp(text_range_to_range(*span));

            Report::build(ReportKind::Error, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message(format!("expected {} parameters", expected_arity))
                        .with_color(Color::Red),
                )
                .finish()
        }
        TypeError::NonFirstClauseAnnotation {
            fn_name,
            what,
            span,
        } => {
            let msg = format!(
                "{} on non-first clause of `{}` will be ignored",
                what, fn_name
            );
            let range = clamp(text_range_to_range(*span));

            Report::build(ReportKind::Warning, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message("only the first clause should have this annotation")
                        .with_color(Color::Yellow),
                )
                .finish()
        }
        TypeError::GuardTypeMismatch {
            expected,
            found,
            span,
        } => {
            let msg = format!("guard expression must return `{}`, found `{}`", expected, found);
            let range = clamp(text_range_to_range(*span));

            Report::build(ReportKind::Error, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message(format!("expected `{}`, found `{}`", expected, found))
                        .with_color(Color::Red),
                )
                .finish()
        }

        TypeError::DuplicateImpl {
            trait_name,
            impl_type,
            first_impl,
        } => {
            let msg = format!(
                "duplicate impl: `{}` is already implemented for `{}`",
                trait_name, impl_type
            );
            let span = clamp(0..source_len.max(1).min(source_len));

            Report::build(ReportKind::Error, (fname.clone(), span.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), span))
                        .with_message(format!("{}", first_impl))
                        .with_color(Color::Red),
                )
                .with_help("remove one of the conflicting impl blocks")
                .finish()
        }

        TypeError::AmbiguousMethod {
            method_name,
            candidate_traits,
            ty,
            span,
        } => {
            let msg = format!(
                "ambiguous method `{}` for type `{}`: candidates from traits [{}]",
                method_name,
                ty,
                candidate_traits.join(", ")
            );
            let range = clamp(text_range_to_range(*span));

            let suggestions: Vec<String> = candidate_traits
                .iter()
                .map(|t| format!("{}.{}(value)", t, method_name))
                .collect();
            let help = format!("use qualified syntax: {}", suggestions.join(" or "));

            Report::build(ReportKind::Error, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message(format!("multiple traits provide `{}`", method_name))
                        .with_color(Color::Red),
                )
                .with_help(help)
                .finish()
        }

        TypeError::UnsupportedDerive {
            trait_name,
            type_name,
        } => {
            let msg = format!(
                "cannot derive `{}` for `{}`",
                trait_name, type_name
            );
            let span = clamp(0..source_len.max(1).min(source_len));

            Report::build(ReportKind::Error, (fname.clone(), span.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), span))
                        .with_message(format!("`{}` is not a derivable trait", trait_name))
                        .with_color(Color::Red),
                )
                .with_help("only Eq, Ord, Display, Debug, Hash, Json, and Row are derivable")
                .finish()
        }

        TypeError::MissingDerivePrerequisite {
            trait_name,
            requires,
            type_name,
        } => {
            let msg = format!(
                "cannot derive `{}` for `{}` without `{}`",
                trait_name, type_name, requires
            );
            let span = clamp(0..source_len.max(1).min(source_len));

            Report::build(ReportKind::Error, (fname.clone(), span.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), span))
                        .with_message(format!(
                            "`{}` requires `{}` for its implementation",
                            trait_name, requires
                        ))
                        .with_color(Color::Red),
                )
                .with_help(format!(
                    "add `{}` to the deriving list: deriving({}, {})",
                    requires, requires, trait_name
                ))
                .finish()
        }

        TypeError::BreakOutsideLoop { span } => {
            let msg = "`break` outside of loop";
            let range = clamp(text_range_to_range(*span));

            Report::build(ReportKind::Error, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message("`break` can only be used inside a `while` loop")
                        .with_color(Color::Red),
                )
                .with_help("move this `break` inside a loop body")
                .finish()
        }

        TypeError::ContinueOutsideLoop { span } => {
            let msg = "`continue` outside of loop";
            let range = clamp(text_range_to_range(*span));

            Report::build(ReportKind::Error, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message("`continue` can only be used inside a `while` loop")
                        .with_color(Color::Red),
                )
                .with_help("move this `continue` inside a loop body")
                .finish()
        }

        TypeError::ImportModuleNotFound { module_name, span, suggestion } => {
            let msg = "module not found";
            let range = clamp(text_range_to_range(*span));

            let mut builder = Report::build(ReportKind::Error, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message(format!("module `{}` not found", module_name))
                        .with_color(Color::Red),
                );

            if let Some(sug) = suggestion {
                builder.set_note(format!("did you mean `{}`?", sug));
            }

            builder.finish()
        }

        TypeError::ImportNameNotFound { module_name, name, span, available } => {
            let msg = "name not found in module";
            let range = clamp(text_range_to_range(*span));

            let mut builder = Report::build(ReportKind::Error, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message(format!("`{}` is not exported by module `{}`", name, module_name))
                        .with_color(Color::Red),
                );

            if !available.is_empty() {
                builder.set_note(format!("available exports: {}", available.join(", ")));
            }

            builder.finish()
        }

        TypeError::PrivateItem { module_name, name, span } => {
            let msg = "private item cannot be imported";
            let range = clamp(text_range_to_range(*span));

            Report::build(ReportKind::Error, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message(format!("`{}` is private in module `{}`", name, module_name))
                        .with_color(Color::Red),
                )
                .with_help(format!("add `pub` to `{}` in module `{}` to make it accessible", name, module_name))
                .finish()
        }

        TypeError::TryIncompatibleReturn { fn_return_ty, span, .. } => {
            let msg = "`?` operator requires function to return `Result` or `Option`";
            let range = clamp(text_range_to_range(*span));

            Report::build(ReportKind::Error, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message("cannot use `?` here")
                        .with_color(Color::Red),
                )
                .with_note(format!(
                    "the enclosing function returns `{}`, but `?` requires `Result<_, _>` or `Option<_>`",
                    fn_return_ty
                ))
                .finish()
        }

        TypeError::TryOnNonResultOption { operand_ty, span } => {
            let msg = "`?` requires `Result` or `Option`";
            let range = clamp(text_range_to_range(*span));

            Report::build(ReportKind::Error, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message(format!("type `{}` is not `Result` or `Option`", operand_ty))
                        .with_color(Color::Red),
                )
                .with_help("the `?` operator can only be used on `Result<T, E>` or `Option<T>` values")
                .finish()
        }

        TypeError::NonSerializableField {
            struct_name: _,
            field_name,
            field_type,
        } => {
            let msg = format!(
                "field `{}` of type `{}` is not JSON-serializable",
                field_name, field_type
            );
            let span = clamp(0..source_len.max(1).min(source_len));

            Report::build(ReportKind::Error, (fname.clone(), span.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), span))
                        .with_message(format!("`{}` is not serializable", field_type))
                        .with_color(Color::Red),
                )
                .with_help(format!(
                    "type `{}` does not derive Json; add `deriving(Json)` to its definition, or use a serializable type (Int, Float, Bool, String, Option<T>, List<T>, Map<String, V>)",
                    field_type
                ))
                .finish()
        }

        TypeError::NonMappableField {
            struct_name: _,
            field_name,
            field_type,
        } => {
            let msg = format!(
                "field `{}` has type `{}` which cannot be mapped from a database row",
                field_name, field_type
            );
            let span = clamp(0..source_len.max(1).min(source_len));

            Report::build(ReportKind::Error, (fname.clone(), span.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), span))
                        .with_message(format!("`{}` is not row-mappable", field_type))
                        .with_color(Color::Red),
                )
                .with_help("only Int, Float, Bool, String, and Option<T> fields are supported for deriving(Row)")
                .finish()
        }

        TypeError::MissingAssocType {
            trait_name,
            assoc_name,
            impl_ty,
        } => {
            let msg = format!(
                "impl `{}` for `{}` is missing associated type `{}`",
                trait_name, impl_ty, assoc_name
            );
            let span = clamp(0..source_len.max(1).min(source_len));

            Report::build(ReportKind::Error, (fname.clone(), span.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), span))
                        .with_message(format!("missing `type {} = ...`", assoc_name))
                        .with_color(Color::Red),
                )
                .with_help(format!("add `type {} = <ConcreteType>` to the impl block", assoc_name))
                .finish()
        }

        TypeError::ExtraAssocType {
            trait_name,
            assoc_name,
            impl_ty,
        } => {
            let msg = format!(
                "impl `{}` for `{}` provides associated type `{}` which is not declared by the trait",
                trait_name, impl_ty, assoc_name
            );
            let span = clamp(0..source_len.max(1).min(source_len));

            Report::build(ReportKind::Error, (fname.clone(), span.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), span))
                        .with_message(format!("`{}` is not declared by `{}`", assoc_name, trait_name))
                        .with_color(Color::Red),
                )
                .finish()
        }

        TypeError::UnresolvedAssocType {
            assoc_name,
            span,
        } => {
            let msg = format!(
                "cannot resolve associated type `{}`",
                assoc_name
            );
            let span = clamp(text_range_to_range(*span));

            Report::build(ReportKind::Error, (fname.clone(), span.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), span))
                        .with_message("Self.Item can only be used inside an impl block")
                        .with_color(Color::Red),
                )
                .finish()
        }

        TypeError::SlotPositionConflict {
            slot,
            fn_name,
            span,
        } => {
            let msg = format!(
                "slot position {} conflicts with an argument already provided to `{}`",
                slot, fn_name
            );
            let range = clamp(text_range_to_range(*span));

            Report::build(ReportKind::Error, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message(format!(
                            "position {} is already filled by an explicit argument",
                            slot
                        ))
                        .with_color(Color::Red),
                )
                .with_help(format!(
                    "remove the argument at position {} from the call, or use a different slot",
                    slot
                ))
                .finish()
        }

        TypeError::SlotPipeOutOfRange {
            slot,
            fn_name,
            arity,
            span,
        } => {
            let msg = if *arity <= 1 {
                format!(
                    "slot position {} is out of range: `{}` takes {} argument(s)",
                    slot, fn_name, arity
                )
            } else {
                format!(
                    "slot position {} is out of range: `{}` takes {} arguments, so valid slot positions are 2\u{2013}{}",
                    slot, fn_name, arity, arity
                )
            };
            let range = clamp(text_range_to_range(*span));

            let mut builder = Report::build(ReportKind::Error, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message(format!("slot {} exceeds function arity {}", slot, arity))
                        .with_color(Color::Red),
                );

            if *arity <= 1 {
                builder.set_help("use |> to pipe as the first argument");
            } else {
                builder.set_help(format!("use |> to pipe as the first argument, or |2>...|{}> for other positions", arity));
            }

            builder.finish()
        }

        TypeError::UndefinedType {
            alias_name,
            target_name,
            span,
        } => {
            let msg = format!(
                "type alias `{}` references undefined type `{}`",
                alias_name, target_name
            );
            let range = clamp(text_range_to_range(*span));

            Report::build(ReportKind::Error, (fname.clone(), range.clone()))
                .with_code(code)
                .with_message(&msg)
                .with_config(config)
                .with_label(
                    Label::new((fname.clone(), range))
                        .with_message(format!("`{}` is not defined", target_name))
                        .with_color(Color::Red),
                )
                .with_help(format!(
                    "define `{}` as a struct, sum type, or type alias before using it here",
                    target_name
                ))
                .finish()
        }
    };

    let mut buf = Vec::new();
    let cache = ariadne::sources([(fname, source.to_string())]);
    report
        .write(cache, &mut buf)
        .expect("failed to write diagnostic");
    String::from_utf8(buf).expect("diagnostic output should be valid UTF-8")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_levenshtein_distance() {
        assert_eq!(levenshtein_distance("kitten", "sitting"), 3);
        assert_eq!(levenshtein_distance("", "abc"), 3);
        assert_eq!(levenshtein_distance("abc", ""), 3);
        assert_eq!(levenshtein_distance("abc", "abc"), 0);
        assert_eq!(levenshtein_distance("abc", "abd"), 1);
        assert_eq!(levenshtein_distance("count", "cound"), 1);
    }

    #[test]
    fn test_find_closest_name() {
        let candidates = vec![
            "count".to_string(),
            "counter".to_string(),
            "amount".to_string(),
        ];
        assert_eq!(
            find_closest_name("cont", &candidates, 2),
            Some("count".to_string())
        );
        assert_eq!(find_closest_name("xyz", &candidates, 2), None);
        assert_eq!(
            find_closest_name("count", &candidates, 2),
            Some("count".to_string())
        );
    }

    #[test]
    fn test_diagnostic_options_default() {
        let opts = DiagnosticOptions::default();
        assert!(opts.color);
        assert!(!opts.json);
    }

    #[test]
    fn test_diagnostic_options_colorless() {
        let opts = DiagnosticOptions::colorless();
        assert!(!opts.color);
        assert!(!opts.json);
    }

    #[test]
    fn test_diagnostic_options_json() {
        let opts = DiagnosticOptions::json_mode();
        assert!(!opts.color);
        assert!(opts.json);
    }

    #[test]
    fn test_json_diagnostic_serialization() {
        let diag = JsonDiagnostic {
            code: "E0001".to_string(),
            severity: "error".to_string(),
            message: "expected Int, found String".to_string(),
            file: "main.mpl".to_string(),
            spans: vec![JsonSpan {
                start: 10,
                end: 15,
                label: "expected Int, found String".to_string(),
            }],
            fix: None,
        };
        let json = serde_json::to_string(&diag).unwrap();
        assert!(json.contains("E0001"));
        assert!(json.contains("expected Int, found String"));
        assert!(json.contains("\"fix\":null"));
    }

    #[test]
    fn test_json_diagnostic_with_fix() {
        let diag = JsonDiagnostic {
            code: "E0001".to_string(),
            severity: "error".to_string(),
            message: "expected Option<Int>, found Int".to_string(),
            file: "test.mpl".to_string(),
            spans: vec![],
            fix: Some("wrap in Some(...)".to_string()),
        };
        let json = serde_json::to_string(&diag).unwrap();
        assert!(json.contains("\"fix\":\"wrap in Some(...)\""));
    }
}
