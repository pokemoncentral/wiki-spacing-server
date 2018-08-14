-- This script initializes the database with a user, a schema and the tables

create user wiki;
create database spacing
    encoding 'UTF8'
    owner wiki;
grant all on database spacing to wiki;

\connect spacing wiki;
create table votes (
    name        text    primary key,
    tiny        text,
    small       text,
    medium      text,
    large       text,
    huge        text
);
