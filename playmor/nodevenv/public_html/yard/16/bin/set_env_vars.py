#!/opt/cloudlinux/venv/bin/python3 -bb
# -*- coding: utf-8 -*-

# Copyright © Cloud Linux GmbH & Cloud Linux Software, Inc 2010-2019 All Rights Reserved
#
# Licensed under CLOUD LINUX LICENSE AGREEMENT
# http://cloudlinux.com/docs/LICENSE.TXT

from __future__ import print_function
from __future__ import division
from __future__ import absolute_import
import os
import sys
import getpass

from future.utils import iteritems

from clselect.clselectnodejs.apps_manager import ApplicationsManager as NodeJsAppsManager
from clselect.clselectpython.apps_manager import ApplicationsManager as PythonAppsManager, get_venv_rel_path
from clselect.utils import get_using_realpath_keys


def get_app_name(interpreter):
    """
    Get application name via CL_APP_ROOT variable
    :param interpreter: interpreter name
    :return: str application name
    """
    if os.environ.get('CL_APP_ROOT'):
        return os.environ['CL_APP_ROOT']
    elif interpreter == 'python':
        abs_venv_path = os.environ['VIRTUAL_ENV']
        user_home = os.environ['HOME']
        # /home/<username>/virtualenv/<name>/<version> ->
        # /virtualenv/<name>
        vevn_rel_path = os.path.dirname(abs_venv_path).replace(user_home + '/', '', 1)
        # if VENV_REL_PATH contains _ we cannot
        # clearly define app_root and should guess
        if '_' in vevn_rel_path:
            username = getpass.getuser()
            # in python CL_APP_ROOT is not set, we must guess by env path
            for app_root in PythonAppsManager().get_user_config_data(username):
                _, rel_path = get_venv_rel_path(username, app_root)
                if rel_path == vevn_rel_path:
                    return app_root
            return None
        else:
            return vevn_rel_path.replace('virtualenv/', '', 1)
    else:
        raise NotImplementedError(
            'I don\'t know how to get app_root for %s' % interpreter)


def get_env_vars(_app_name, interpreter):
    """
    Get environment variables from user config for given application name
    :param _app_name: application name
    :param interpreter: interpreter name
    :return: dict {ENV_VAR_NAME: VALUE}
    """
    _env_vars = {}
    username = getpass.getuser()
    try:
        full_app_config = get_app_full_conf(username, _app_name, interpreter)
        if interpreter == 'nodejs':
            _env_vars['NODE_ENV'] = full_app_config['app_mode']
        _env_vars.update(full_app_config['env_vars'])
    except KeyError:
        pass
    return _env_vars


def set_env_vars(dict_env_vars):
    """
    Print to stdout bash strings with environment variables
    :param dict_env_vars: dict with environment variables
    :return: None
    """
    for key, var in iteritems(dict_env_vars):
        print('export {}="{}"'.format(key, var))


def is_root():
    return os.geteuid() == 0


def get_app_full_conf(user, app, interpreter):
    if interpreter == 'nodejs':
        manager = NodeJsAppsManager()
    elif interpreter == 'python':
        manager = PythonAppsManager()
    else:
        raise NotImplementedError()
    full_user_config = manager.get_user_config_data(user)
    if not full_user_config:
        print("User config was not found or empty")
        sys.exit(0)
    return get_using_realpath_keys(user, app, full_user_config)


if __name__ == "__main__":
    if is_root():
        print("This program is not intended to be run as root.")
        sys.exit(1)
    args = sys.argv
    if len(args) < 2:
        print("Interpreter is not passed.")
        sys.exit(1)
    app_name = get_app_name(sys.argv[1])
    if app_name is None:
        print("Unknown application.")
        sys.exit(1)
    env_vars = get_env_vars(app_name, sys.argv[1])
    set_env_vars(env_vars)
