pub struct Todo do
  id :: String
  title :: String
  completed :: Bool
  created_at :: String
end deriving(Json, Row)
