#!/bin/bash

prisma migrate deploy

node server.js
