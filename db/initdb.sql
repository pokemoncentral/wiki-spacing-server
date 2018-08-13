-- This script initializes the database with a user, a schema and the tables

create user wiki;
create database spacing
    encoding 'UTF8'
    owner wiki;

\connect spacing wiki;
create table votes (
    name        text,
    tiny        text,
    small       text,
    medium      text,
    large       text,
    huge        text
);
