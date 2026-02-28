fn main() do
  let present = Some("value")
  let absent :: Option<String> = None
  let r1 = json { data: present }
  let r2 = json { data: absent }
  println(r1)
  println(r2)
end
