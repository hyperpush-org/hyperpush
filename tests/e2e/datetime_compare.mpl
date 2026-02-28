// Expected output:
// true
// false
// false
// true
fn main() do
  let r1 = DateTime.from_unix_ms(1705312200000)
  let r2 = DateTime.from_unix_ms(1705398600000)
  case r1 do
    Ok(earlier) ->
      case r2 do
        Ok(later) ->
          println(DateTime.before?(earlier, later))
          println(DateTime.after?(earlier, later))
          println(DateTime.before?(later, earlier))
          println(DateTime.after?(later, earlier))
        Err(e) -> println(e)
      end
    Err(e) -> println(e)
  end
end
