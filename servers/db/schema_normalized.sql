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

-- Populate users table with a couple of test users on startup;
insert into users (email, passhash, username, firstname, lastname, photourl)
values ('test@test.com', 'passhash', 'test1', 'test', 'test', 'photourl');

insert into users (email, passhash, username, firstname, lastname, photourl)
values ('test2@test.com', 'passhash', 'test2', 'test', 'test', 'photourl');

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

create table if not exists companies (
    "companyID"       serial primary key,
    "companyName"     varchar(128) not null,
    "companyLogoURL"  varchar(255)
);

insert into companies ("companyName", "companyLogoURL")
values ('TestCompany1', 'http://www.testcompany1.com/logourl');

create table if not exists positiontags (
    "positionTagID"   serial primary key,
    tag               varchar(32)
);

insert into positiontags (tag)
values ('TestTag');

create table if not exists positions (
    "positionID"       serial primary key,
    "companyID"        int references companies("companyID") not null,
    "positionName"     varchar(128) not null,
    "positionTagIDs"   int[],
    "experienceLevel"  varchar(32),
    "positionURL"      varchar(255),
    location           varchar(128),
    season             varchar(32)
);

insert into positions ("companyID", "positionName")
values (1, 'TestPosition1');

create table if not exists applications (
    "applicationID"  serial primary key,
    "userID"         int references users(id) not null,
    "positionID"     int references positions("positionID") not null,
    status           varchar(128) not null,
    "dateApplied"    timestamp,
    "dateReplied"    timestamp
);

insert into applications ("userID", "positionID", status)
values (1, 1, 'TestStatus');

create table if not exists stagetags (
    "stageTagIDs"  serial primary key,
    tag          varchar(32)
);

insert into stagetags (tag)
values ('TestTag');

create table if not exists stages (
    "stageID"        serial primary key,
    "applicationID"  int references applications("applicationID") not null,
    "stageTagIDs"    int[],
    "stageType"      varchar(32) not null,
    "stageDate"      timestamp,
    "stageNum"       int not null,
    "stageURL"       varchar(255),
    duration         int not null,
    notes            varchar(4096)
);

insert into stages ("applicationID", "stageType", "stageNum", duration)
values (1, 'TestStageType', 1, 60);
