#!/usr/bin/env python3

import subprocess
import os

repos = {
    "local-staging": {
        "aoe2hd-frontend": "/Users/tonyblum/projects/app-staging",
        "aoe2hd-parsing": "/Users/tonyblum/projects/api-staging",
        "explorerdev": "/Users/tonyblum/projects/explorer-staging",
        "wolodev": "/Users/tonyblum/projects/wolo-staging",
    },
    "local-prod": {
        "aoe2hd-frontend": "/Users/tonyblum/projects/app-prod",
        "aoe2hd-parsing": "/Users/tonyblum/projects/api-prod",
        "explorerdev": "/Users/tonyblum/projects/explorer-prod",
        "wolodev": "/Users/tonyblum/projects/wolo-prod",
    },
    "vps-staging": {
        "aoe2hd-frontend": "/var/www/app-staging",
        "aoe2hd-parsing": "/var/www/api-staging",
        "explorerdev": "/var/www/explorer-staging",
        "wolodev": "/var/www/wolo-staging",
    },
    "vps-prod": {
        "aoe2hd-frontend": "/var/www/app-prod",
        "aoe2hd-parsing": "/var/www/api-prod",
        "explorerdev": "/var/www/explorer-prod",
        "wolodev": "/var/www/wolo-prod",
    }
}

def check_status(repo_path):
    if not os.path.exists(repo_path):
        return f"{repo_path} ❌ Not found"
    try:
        os.chdir(repo_path)
        branch = subprocess.check_output(["git", "branch", "--show-current"], text=True).strip()
        status = subprocess.check_output(["git", "status", "--short"], text=True).strip()
        remote_diff = subprocess.check_output(
            ["git", "rev-list", "--left-right", "--count", f"{branch}...origin/{branch}"],
            text=True
        ).strip()
        ahead, behind = map(int, remote_diff.split())
        return f"{repo_path} [{branch}] ✅ Ahead: {ahead}, Behind: {behind}, Dirty: {'Yes' if status else 'No'}"
    except Exception as e:
        return f"{repo_path} ❌ Error: {e}"

def main():
    for scope, paths in repos.items():
        print(f"\n🔍 {scope.upper()} REPOS")
        for name, path in paths.items():
            print(" •", check_status(path))

if __name__ == "__main__":
    main()
