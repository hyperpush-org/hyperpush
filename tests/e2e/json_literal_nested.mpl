fn main() do
  let inner = json { code: 200 }
  let outer = json { result: inner, ok: true }
  println(outer)
end
