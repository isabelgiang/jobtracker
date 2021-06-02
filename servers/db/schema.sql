/* Table to contain User records
   Note: varchar limits were selected to be a practical limit.
   These limits are not enforced in user.go
*/
create table if not exists users (
    id         serial       primary key,
    email      varchar(320) unique       not null, /* https://tools.ietf.org/html/rfc3696 */
    passhash   bytea                     not null,
    username   varchar(255) unique       not null,
    firstname  varchar(32),
    lastname   varchar(32),
    photourl   varchar(68)               not null  -- TODO: remove
);

create table if not exists usersignins (
    id          serial primary key,
    userid      int not null,
    signintime  timestamp not null,
    IP          varchar(45) not null
);

/* Note on varchar column lengths
   - Categories and tags: 32
   - Names and locations: 128
   - URLs: 255
   - Freeform input: 4096
*/

create table if not exists applications (
    id              serial primary key,
    "userID"        int references users(id) not null,
    "positionName"  varchar(128) not null,
    "positionURL"   varchar(255),
    "companyName"   varchar(128) not null,
    location        varchar(128),
    status          varchar(32) not null,
    "dateApplied"   timestamp,
    "dateReplied"   timestamp,
    "createdDate"   timestamp not null,
    "updatedDate"   timestamp not null
);

insert into applications ("userID", "positionName", "companyName", status, "createdDate", "updatedDate")
values (1, 'TestPositionName', 'TestCompanyName', 'TestStatus', now(), now());

create table if not exists stages (
    id               serial primary key,
    "applicationID"  int references applications(id) not null,
    "stageType"      varchar(32) not null,
    "stageDate"      timestamp not null,
    "durationMins"   int not null,
    notes            varchar(4096),
    "createdDate"    timestamp not null,
    "updatedDate"    timestamp not null
);

insert into stages ("applicationID", "stageType", "stageDate", "durationMins", "createdDate", "updatedDate")
values (1, 'TestStageType', date '2021-06-03', 60, now(), now());
