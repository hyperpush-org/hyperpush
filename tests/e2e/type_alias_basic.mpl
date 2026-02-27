type Url = String
type UserId = Int

fn fetch(url :: Url) -> Url do
  url
end

fn get_user(id :: UserId) -> UserId do
  id
end

fn main() do
  let url :: Url = "https://example.com"
  let id :: UserId = 42
  println(fetch(url))
  println("${get_user(id)}")
end
