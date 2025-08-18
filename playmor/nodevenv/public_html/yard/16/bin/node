#!/bin/bash

if [[ $EUID -eq 0 ]]; then
   echo "This program is not intended to be run as root." 1>&2
   exit 1
fi

CWD=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
source ${CWD}/activate
eval $(${CWD}/set_env_vars.py nodejs)

exec "${CL_NODEHOME}/usr/bin/node" "$@"