# pub-vpc-rds

## providing VPC, RDS and postgres schema/role/user for other app/services.


## share nat accross accounts, share pool accross accounts

https://github.com/ondemandenv/pub-vpc-rds/blob/a62e4c7421cd825a4b1c44ca019471d7e1f5d773/lib/repo-build-ctl-vpc.ts#L43
[natGateways number is 0](https://github.com/ondemandenv/odmd-build-contracts/blob/fd2e2db792cd81af2c6f66bcbdd43a4f59206100/lib/odmd-model/contracts-vpc.ts#L24)

allocate CIDR from a share cidr pool accross accounts:  https://github.com/ondemandenv/pub-vpc-rds/blob/a62e4c7421cd825a4b1c44ca019471d7e1f5d773/lib/repo-build-ctl-vpc.ts#L45



share nat thru transit gateway: https://github.com/ondemandenv/pub-vpc-rds/blob/a62e4c7421cd825a4b1c44ca019471d7e1f5d773/lib/repo-build-ctl-vpc.ts#L83

route internet traffic thru transit gateway to share NAT.


decluared consuming in contracts, actually usage: 

this is referencing the central vpc's cidr where lambda will create schema and users for rds cluster in this stack:
https://github.com/ondemandenv/pub-vpc-rds/blob/a62e4c7421cd825a4b1c44ca019471d7e1f5d773/lib/repo-build-ctl-vpc-rds.ts#L73

[allow other CIDRs to access database](https://github.com/ondemandenv/odmd-build-contracts/blob/fd2e2db792cd81af2c6f66bcbdd43a4f59206100/lib/odmd-model/contracts-rds-cluster.ts#L29)

[declared in contracts allowing eks cluster to access](https://github.com/ondemandenv/odmd-build-contracts/blob/fd2e2db792cd81af2c6f66bcbdd43a4f59206100/lib/repos/sample/spring-img/odmd-enver-sample-spring-img.ts#L102)
implement usaging consumer reference:
https://github.com/ondemandenv/pub-vpc-rds/blob/a62e4c7421cd825a4b1c44ca019471d7e1f5d773/lib/repo-build-ctl-vpc-rds.ts#L76


Share RDS cluster interface for others to use:
https://github.com/ondemandenv/pub-vpc-rds/blob/a62e4c7421cd825a4b1c44ca019471d7e1f5d773/lib/repo-build-ctl-vpc-rds.ts#L99
