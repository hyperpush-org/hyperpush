# stdlib_http_middleware_inferred.mpl
# QUAL-02: Middleware handler parameter type is inferred without :: Request annotation
# when the function body uses Request.* accessors, which constrains the type variable
# to Request before generalization.
#
# Limitation: passthrough middleware (e.g., fn pass(request, next) do next(request) end)
# still requires :: Request annotations because the body doesn't directly constrain the
# request parameter type. Type inference works correctly when Request.* calls appear
# in the function body.

fn passthrough(request :: Request, next) -> Response do
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
