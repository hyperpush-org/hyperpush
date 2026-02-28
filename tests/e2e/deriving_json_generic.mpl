struct Wrapper<T> do
  value :: T
end deriving(Json)

fn main() do
  let w1 = Wrapper { value: 42 }
  let json1 = Json.encode(w1)
  println(json_str1)

  let w2 = Wrapper { value: "hello" }
  let json2 = Json.encode(w2)
  println(json_str2)
end
