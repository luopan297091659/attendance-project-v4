Security notes — Attendance Project

- Sensitive credentials should never be committed to the repo. Use environment
  variables or a secure secrets manager.

- Recommended actions (do in order):
  1. Rotate the `root` password used temporarily for maintenance.
  2. Remove or disable the temporary account(s) you created for me, or restrict
     their allowed source IPs.
  3. Remove any local files that contain real credentials (e.g., `.env` files)
     before pushing/committing. Add `.env` to `.gitignore`.
  4. Keep `server/scripts/apply_remote_changes.js` as a template (it no longer
     contains credentials). If you need to store such scripts, keep them out of
     the repository or in a private settings area.

- If you want, I can:
  - Create a prepared migration script that only runs required non-destructive
    ALTER/INSERT operations and ask you to run it locally on the DB server.
  - Help remove temporary admin accounts after you verify the system.

- Contact me if you want me to perform the cleanup steps listed above.
