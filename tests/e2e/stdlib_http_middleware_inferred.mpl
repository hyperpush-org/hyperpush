# stdlib_http_middleware_inferred.mpl
# QUAL-02: Middleware handler parameter type is inferred without :: Request annotation.
# Both passthrough middleware and handler functions work without explicit type annotations.
# The lowerer recovers concrete parameter types from call-site usage types when the
# type checker's let-generalization would otherwise leave them as unresolved Ty::Var.

fn passthrough(request, next) -> Response do
  next(request)
end

fn handler(request) do
  let path = Request.path(request)
  HTTP.response(200, path)
end

fn main() do
  let r = HTTP.router()
  let r = HTTP.use(r, passthrough)
  let r = HTTP.route(r, "/test", handler)
  println("middleware_inferred_ok")
end
