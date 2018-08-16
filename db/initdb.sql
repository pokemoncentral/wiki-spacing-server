-- This script initializes the database with a user, a schema and the tables

create user wiki;
create database spacing
    encoding 'UTF8'
    owner wiki;
grant all on database spacing to wiki;

\connect spacing wiki;
create table votes (
    name        text    primary key,
    tiny        text    not null,
    small       text    not null,
    medium      text    not null,
    large       text    not null,
    huge        text    not null
);
