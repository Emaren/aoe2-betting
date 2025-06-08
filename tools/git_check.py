#!/usr/bin/env python3

import subprocess
import os

repos = {
    "local": {
        "aoe2hd-frontend": "/Users/tonyblum/projects/aoe2hd-frontend",
        "aoe2hd-parsing": "/Users/tonyblum/projects/aoe2hd-parsing",
        "bdjuno-wolo": "/Users/tonyblum/projects/bdjuno-wolo",
        "big-dipper-2.0-cosmos": "/Users/tonyblum/projects/big-dipper-2.0-cosmos",
        "explorerdev": "/Users/tonyblum/projects/explorerdev",
        "wolodev": "/Users/tonyblum/projects/wolodev",
    },
    "vps": {
        "aoe2hd-frontend": "/var/www/aoe2hdbets.com-app/aoe2hd-frontend",
        "aoe2hd-parsing": "/var/www/aoe2hdbets-api/aoe2hd-parsing",
        "bdjuno-wolo": "/var/www/bdjuno-wolo",
        "big-dipper-2.0-cosmos": "/var/www/big-dipper-2.0-cosmos",
        "explorerdev": "/var/www/explorerdev",
        "wolodev": "/var/www/wolodev",
    }
}

def check_status(repo_path):
    if not os.path.exists(repo_path):
        return f"{repo_path} ❌ Not found"
    try:
        os.chdir(repo_path)
        branch = subprocess.check_output(["git", "branch", "--show-current"], text=True).strip()
        status = subprocess.check_output(["git", "status", "--short"], text=True).strip()
        remote_diff = subprocess.check_output(["git", "rev-list", "--left-right", "--count", f"{branch}...origin/{branch}"], text=True).strip()
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

