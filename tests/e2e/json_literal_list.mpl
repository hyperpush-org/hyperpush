fn main() do
  let tags = ["error", "critical"]
  let event = json { tags: tags, count: 2 }
  println(event)
end
