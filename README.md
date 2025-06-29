# Jujutsu MCP Server

A Model Context Protocol (MCP) server for interacting with Jujutsu version control.

## Available Tools

This server exposes several tools to manage your Jujutsu repository, including:

- `jj_status`: Shows the current state of the working copy and the repo.
- `jj_log`: Shows the commit history.
- `jj_commit`: Creates a new commit.
- `jj_desc`: Amends the description of the specified commit.
- `jj_bookmark`: Manages bookmarks.
- `jj_bookmark_move`: Moves existing bookmarks to a target revision.
- `jj_diff`: Shows the diff of the specified revision.
- `jj_abandon`: Abandons the specified revision.
- `jj_squash`: Moves changes from a revision into another revision.
- `jj_rebase`: Moves revisions to different parent(s).
- `jj_git_push`: Pushes to a Git remote.
- `jj_git_fetch`: Fetches from a Git remote.

## Available Resources

- `jujutsu://info`: Provides general information about the Jujutsu repository.
