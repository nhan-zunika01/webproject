# Cloudflare D1 Database Setup Instructions

This document provides the necessary steps to create, configure, and bind a Cloudflare D1 database for this project. These steps are required for the application to function correctly after its migration from Supabase.

You will need to have the [Cloudflare Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed and authenticated to your Cloudflare account.

---

### Step 1: Create a New D1 Database

First, create a new D1 database. We recommend naming it `webproject-db`, but you can choose another name.

Run the following command in your terminal:

```sh
npx wrangler d1 create webproject-db
```

After running this command, Wrangler will output the database details, including the `database_name` and `database_id`. It will also add a configuration block to your `wrangler.toml` file. If you don't have a `wrangler.toml` file, it will be created.

---

### Step 2: Apply the Database Schema

Now that the database is created, you need to apply the schema defined in the `migrations` folder.

Run the following command, making sure to use the database name you chose in Step 1:

```sh
npx wrangler d1 execute webproject-db --file=./migrations/0000_initial_schema.sql
```

This command executes the SQL file against your new database, creating all the necessary tables (`users`, `posts`, `post_comments`, etc.).

---

### Step 3: Bind the Database to Your Pages Project

For the deployed application (and local development) to access the database, you must bind it to your Cloudflare Pages project. The application code expects the binding to be named `DB`.

You can do this in the Cloudflare Dashboard:

1.  Navigate to your Cloudflare Pages project.
2.  Go to **Settings** > **Functions**.
3.  Under **D1 database bindings**, click **Add binding**.
4.  Set the **Variable name** to `DB`.
5.  Select the database you created (e.g., `webproject-db`) from the **D1 database** dropdown.
6.  Click **Save**.

This ensures that the functions can access the database via `env.DB`.

---

### Step 4: Set the JWT Secret

The new custom authentication system requires a secret key to sign JSON Web Tokens (JWTs). This must be configured as an environment variable in your Pages project.

1.  Generate a strong, random secret key. You can use a password generator or run the following command in your terminal to generate a 64-character hex string:
    ```sh
    openssl rand -hex 32
    ```
2.  In your Cloudflare Pages project dashboard, go to **Settings** > **Environment variables**.
3.  Under **Production**, click **Add variable**.
4.  Set the **Variable name** to `JWT_SECRET`.
5.  Paste your generated secret key into the **Value** field.
6.  **Important:** Click the **Encrypt** button to protect your secret.
7.  Click **Save**.

After completing these steps, redeploy your Pages project to apply the new settings. Your application will then be fully configured to use Cloudflare D1.