# wiki-spacing-server

Tiny server to agree on spacing values

## Docker

This server is meant to be developed using docker. Since a couple of 
environment variables need to be exported, the `docker-compose` commands are
wrapped in the `compose.sh` script, that is used for example in this way:

```bash
bash compose.sh up
```

By default `compose.sh` runs the `compose-dev.yaml` file, meant for 
development. In order to execute the other setup, the `E` flag can be used.
Its argument selects the other `compose-*.yaml` file that overrides the 
development one. The following commands use the production and testing 
configuration respectively:

```bash
bash compose.sh -E prod build   # builds the production images
bash compose.sh -E test down    # tears down the testing containers
```

### Environments

- **Development**: Uses standard `amd64` architecture docker images, and runs
    the server with [nodemon](https://nodemon.io/) to watch the code.
- **Production**: Uses `armv7` docker images, and runs the server with 
    standard `node`.
- **Test**: Same as development, but runs the tests instead of the server.
