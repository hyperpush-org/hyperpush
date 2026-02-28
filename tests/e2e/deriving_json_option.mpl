struct Profile do
  name :: String
  bio :: Option<String>
end deriving(Json)

fn main() do
  let with_bio = Profile { name: "Alice", bio: Some("Hello!") }
  let json1 = Json.encode(with_bio)
  println(json_str1)

  let without_bio = Profile { name: "Bob", bio: None }
  let json2 = Json.encode(without_bio)
  println(json_str2)
end
