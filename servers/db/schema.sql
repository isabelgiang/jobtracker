/* Table to contain User records
   Note: varchar limits were selected to be a practical limit.
   These limits are not enforced in user.go
*/
create table if not exists users (
    id         bigserial    primary key,
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
    id          bigserial primary key,
    userid      bigserial not null,
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
    companyID       bigserial primary key,
    companyName     varchar(128) not null,
    companyLogoURL  varchar(255)
);

create table if not exists positiontags (
    positionTagID   serial primary key,
    tag             varchar(32),
);

create table if not exists positions (
    positionID       bigserial primary key,
    companyID        bigint references companies(companyID) not null,
    positionName     varchar(128) not null,
    positionTagIDs   int[] references positiontags(positionTagID),
    experienceLevel  varchar(32),
    positionURL      varchar(255),
    location         varchar(128),
    season           varchar(32)
);

create table if not exists applications (
    applicationID  bigserial primary key,
    userID         bigint references users(id) not null,
    positionID     bigint references positions(positionID) not null,
    status         varchar(128) not null,
    dateApplied    timestamp,
    dateReplied    timestamp
);

create table if not exists stagetags (
    stageTagIDs  serial primary key,
    tag          varchar(32)
);

create table if not exists stages (
    stageID        bigserial primary key,
    applicationID  bigint references applications(applicationID) not null,
    stageTagIDs    int[] references stagetags(stageTagID),
    stageType      varchar(32) not null,
    stageDate      timestamp,
    stageNum       int not null,
    stageURL       varchar(255),
    duration       int not null,
    notes          varchar(4096)
);