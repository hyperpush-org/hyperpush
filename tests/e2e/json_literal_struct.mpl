struct Point do
  x :: Int
  y :: Int
end deriving(Json)

fn main() do
  let p = Point { x: 3, y: 4 }
  let r = json { point: p, label: "origin" }
  println(r)
end
