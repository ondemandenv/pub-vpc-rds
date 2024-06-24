# pub-vpc-rds

## Providing VPC, RDS cluster and Postgres schema/role/user for other app/services.

### Depend on networking service's shared nat and shared pool accross accounts
Allocate CIDR from a networking's share cidr pool accross accounts:  https://github.com/ondemandenv/pub-vpc-rds/blob/a62e4c7421cd825a4b1c44ca019471d7e1f5d773/lib/repo-build-ctl-vpc.ts#L45
Referencing to networking CIDR pool is [declared in contracts](https://github.com/ondemandenv/odmd-build-contracts/blob/fd2e2db792cd81af2c6f66bcbdd43a4f59206100/lib/repos/_default-vpc-rds/odmd-enver-default-vpc-rds.ts#L28)

Share nat thru transit gateway: https://github.com/ondemandenv/pub-vpc-rds/blob/a62e4c7421cd825a4b1c44ca019471d7e1f5d773/lib/repo-build-ctl-vpc.ts#L83

Referencing to networking TGW is [declared in contracts](https://github.com/ondemandenv/odmd-build-contracts/blob/fd2e2db792cd81af2c6f66bcbdd43a4f59206100/lib/repos/_default-vpc-rds/odmd-enver-default-vpc-rds.ts#L33)

https://github.com/ondemandenv/pub-vpc-rds/blob/a62e4c7421cd825a4b1c44ca019471d7e1f5d773/lib/repo-build-ctl-vpc.ts#L43
[natGateways number is 0](https://github.com/ondemandenv/odmd-build-contracts/blob/fd2e2db792cd81af2c6f66bcbdd43a4f59206100/lib/odmd-model/contracts-vpc.ts#L24)




Route internet traffic thru transit gateway to share NAT.


decluared consuming in contracts, actually usage: 

this is referencing the central vpc's cidr [delcared in contracts](https://github.com/ondemandenv/odmd-build-contracts/blob/fd2e2db792cd81af2c6f66bcbdd43a4f59206100/lib/repos/__networking/odmd-config-networking.ts#L27)
where lambda will create schema and users for rds cluster in this stack:
https://github.com/ondemandenv/pub-vpc-rds/blob/a62e4c7421cd825a4b1c44ca019471d7e1f5d773/lib/repo-build-ctl-vpc-rds.ts#L73

[allow other CIDRs to access database](https://github.com/ondemandenv/odmd-build-contracts/blob/fd2e2db792cd81af2c6f66bcbdd43a4f59206100/lib/odmd-model/contracts-rds-cluster.ts#L29)

[declared in contracts allowing eks cluster to access](https://github.com/ondemandenv/odmd-build-contracts/blob/fd2e2db792cd81af2c6f66bcbdd43a4f59206100/lib/repos/sample/spring-img/odmd-enver-sample-spring-img.ts#L102)
implement usaging consumer reference:
https://github.com/ondemandenv/pub-vpc-rds/blob/a62e4c7421cd825a4b1c44ca019471d7e1f5d773/lib/repo-build-ctl-vpc-rds.ts#L76


Share RDS cluster interface for others to use:
https://github.com/ondemandenv/pub-vpc-rds/blob/a62e4c7421cd825a4b1c44ca019471d7e1f5d773/lib/repo-build-ctl-vpc-rds.ts#L99

[Declared in contracts](https://github.com/ondemandenv/odmd-build-contracts/blob/fd2e2db792cd81af2c6f66bcbdd43a4f59206100/lib/repos/sample/cdk/odmd-enver-sample-spring-cdk-ecs.ts#L54) Implementing Postgre schema/role/user: 
https://github.com/ondemandenv/pub-vpc-rds/blob/a62e4c7421cd825a4b1c44ca019471d7e1f5d773/lib/repo-build-ctl-vpc-rds-schusrs.ts#L16
