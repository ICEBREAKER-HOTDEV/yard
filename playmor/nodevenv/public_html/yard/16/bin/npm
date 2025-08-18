#!/bin/bash

if [[ $EUID -eq 0 ]]; then
   echo "This program is not intended to be run as root." 1>&2
   exit 1
fi

error_msg="Cloudlinux NodeJS Selector demands to store node modules for application in separate folder \
(virtual environment) pointed by symlink called \"node_modules\". That's why application should not contain \
folder/file with such name in application root"

CWD=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
source "${CWD}/activate"
eval $(${CWD}/set_env_vars.py nodejs)

app_node_modules="${HOME}/${CL_APP_ROOT}/node_modules"
venv_node_modules="${CL_VIRTUAL_ENV}/lib/node_modules"
nodejs_npm="$CL_NODEHOME/usr/bin/npm"

# install with its aliases and list with its alias without arguments or +args
if [[ "$@" =~ ^(install|i|add|list|la|ll)$ || "$@" =~ ^(install|i|add|list|la|ll)[[:space:]].*$ ]]; then

    # We remove old symlink `~/app_root/node_modules` if it exists
    if [[ -L "${app_node_modules}" ]]; then
        rm -f "${app_node_modules}" || (echo "Can't remove symlink "${app_node_modules} 1>&2 && exit 1)
    # We print error end exit 1 if `~/app_root/node_modules` is dir or file
    elif [[ -d "${app_node_modules}" || -f "${app_node_modules}" ]]; then
        echo "${error_msg}" 1>&2 && exit 1
    fi
    # we should create venv/node_modules, https://docs.cloudlinux.com/index.html?link_traversal_protection.html
    mkdir -p "${venv_node_modules}"
    # Create symlink ~/app_root/node_modules to ~/nodevenv/app_root/int_version/lib/node_modules
    ln -fs "${venv_node_modules}" "${app_node_modules}"
    ln -sf "${HOME}/${CL_APP_ROOT}/package.json" "${CL_VIRTUAL_ENV}/lib/package.json"
    exec "${nodejs_npm}" "$@" --prefix="${CL_VIRTUAL_ENV}/lib"
else
    exec "${nodejs_npm}" "$@"
fi