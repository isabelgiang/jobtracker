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
    photourl   varchar(68)               not null
);

-- Populate users table with a couple of test users on startup;
insert into users (email, passhash, username, firstname, lastname, photourl)
values ('test@test.com', 'passhash', 'test1', 'test', 'test', 'photourl');

insert into users (email, passhash, username, firstname, lastname, photourl)
values ('test2@test.com', 'passhash', 'test2', 'test', 'test', 'photourl');

create table if not exists usersignins (
    id          bigserial primary key,
    userid      bigserial not null,
    signintime  timestamp not null,  /* store as UTC timestamps? haven't really though too much about it yet */
    IP          varchar(45) not null
);