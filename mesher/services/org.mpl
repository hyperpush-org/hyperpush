# Organization service module.
# Thin actor wrapper for org CRUD operations.
# Delegates to query functions in Storage.Queries.

from Storage.Queries import insert_org, get_org, list_orgs
from Types.Project import Organization

service OrgService do
  fn init(pool :: PoolHandle) -> PoolHandle do
    pool
  end
  
  call CreateOrg(name :: String, slug :: String) do|pool|
    let result = insert_org(pool, name, slug)
    (pool, result)
  end
  
  call GetOrg(id :: String) do|pool|
    let result = get_org(pool, id)
    (pool, result)
  end
  
  call ListOrgs() do|pool|
    let result = list_orgs(pool)
    (pool, result)
  end
end
