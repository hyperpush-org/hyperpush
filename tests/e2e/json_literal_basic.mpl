fn main() do
  let a = json { status: "ok" }
  println(a)
  let b = json { count: 42, active: true }
  println(b)
  let c = json { value: nil }
  println(c)
end
