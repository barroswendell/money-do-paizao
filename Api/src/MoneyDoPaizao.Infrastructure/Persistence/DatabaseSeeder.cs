using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MoneyDoPaizao.Application.Interfaces;
using MoneyDoPaizao.Domain.Entities;
using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Infrastructure.Persistence;

public static class DatabaseSeeder
{
    public static async Task<bool> InitializeAsync(
        IServiceProvider services,
        IConfiguration configuration,
        CancellationToken cancellationToken = default)
    {
        var context = services.GetRequiredService<MoneyDoPaizaoDbContext>();
        await context.Database.EnsureCreatedAsync(cancellationToken);
        var createdApplicationTables = false;
        if (!await ApplicationTablesExistAsync(context, cancellationToken))
        {
            await context.Database.ExecuteSqlRawAsync(context.Database.GenerateCreateScript(), cancellationToken);
            createdApplicationTables = true;
        }
        await EnsureApplicationSchemaAsync(context, cancellationToken);

        if (!bool.TryParse(configuration["AdminSeed:Enabled"], out var seedEnabled) || !seedEnabled)
        {
            return createdApplicationTables;
        }

        var email = configuration["AdminSeed:Email"] ?? "admin@moneydopaizao.local";
        var existingAdmin = await context.Users.SingleOrDefaultAsync(item => item.Email == email, cancellationToken);
        if (existingAdmin is not null)
        {
            return createdApplicationTables;
        }

        var hasher = services.GetRequiredService<IPasswordHasher>();
        var module = Enum.TryParse<ProductModule>(configuration["AdminSeed:Module"], true, out var configuredModule)
            ? configuredModule
            : ProductModule.Loans;
        var account = Account.Create(
            configuration["AdminSeed:AccountName"] ?? "Conta de empréstimos",
            module);
        var admin = User.Create(
            account.Id,
            configuration["AdminSeed:Name"] ?? "Administrador",
            email,
            configuration["AdminSeed:Cpf"] ?? "00000000000",
            DateTime.TryParse(configuration["AdminSeed:BirthDate"], out var birthDate)
                ? birthDate
                : new DateTime(1990, 1, 1),
            hasher.Hash(configuration["AdminSeed:Password"] ?? "Admin@123"),
            UserRole.Admin);

        await context.Accounts.AddAsync(account, cancellationToken);
        await context.Users.AddAsync(admin, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static async Task<bool> ApplicationTablesExistAsync(
        MoneyDoPaizaoDbContext context,
        CancellationToken cancellationToken)
    {
        await context.Database.OpenConnectionAsync(cancellationToken);
        try
        {
            await using var command = context.Database.GetDbConnection().CreateCommand();
            command.CommandText = "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users');";
            return (bool)(await command.ExecuteScalarAsync(cancellationToken) ?? false);
        }
        finally
        {
            await context.Database.CloseConnectionAsync();
        }
    }

    private static async Task EnsureApplicationSchemaAsync(
        MoneyDoPaizaoDbContext context,
        CancellationToken cancellationToken)
    {
        // The first version of the app was deployed before the account/workspace
        // model existed. This is idempotent and preserves existing Supabase data.
        const string sql = """
            CREATE TABLE IF NOT EXISTS public.accounts (
                id uuid PRIMARY KEY,
                name varchar(160) NOT NULL,
                module varchar(40) NOT NULL DEFAULT 'Loans',
                created_at_utc timestamp without time zone NOT NULL DEFAULT (timezone('utc', now())),
                use_custom_theme boolean NOT NULL DEFAULT false,
                primary_color varchar(7) NOT NULL DEFAULT '#071629',
                secondary_color varchar(7) NOT NULL DEFAULT '#D4A64A',
                is_dark_mode boolean NOT NULL DEFAULT false
            );

            CREATE TABLE IF NOT EXISTS public.account_modules (
                id uuid PRIMARY KEY,
                account_id uuid NOT NULL,
                module varchar(40) NOT NULL,
                active boolean NOT NULL DEFAULT true,
                activated_at_utc timestamp without time zone NOT NULL DEFAULT (timezone('utc', now())),
                CONSTRAINT account_modules_account_module_unique UNIQUE (account_id, module)
            );

            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'Id') THEN ALTER TABLE public.users RENAME COLUMN "Id" TO id; END IF;
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'Name') THEN ALTER TABLE public.users RENAME COLUMN "Name" TO name; END IF;
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'Email') THEN ALTER TABLE public.users RENAME COLUMN "Email" TO email; END IF;
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'Cpf') THEN ALTER TABLE public.users RENAME COLUMN "Cpf" TO cpf; END IF;
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'BirthDate') THEN ALTER TABLE public.users RENAME COLUMN "BirthDate" TO birth_date; END IF;
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'PasswordHash') THEN ALTER TABLE public.users RENAME COLUMN "PasswordHash" TO password_hash; END IF;
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'Role') THEN ALTER TABLE public.users RENAME COLUMN "Role" TO role; END IF;
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'CreatedAtUtc') THEN
                    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'created_at_utc') THEN
                        UPDATE public.users SET created_at_utc = "CreatedAtUtc" WHERE "CreatedAtUtc" IS NOT NULL;
                        ALTER TABLE public.users DROP COLUMN "CreatedAtUtc";
                    ELSE
                        ALTER TABLE public.users RENAME COLUMN "CreatedAtUtc" TO created_at_utc;
                    END IF;
                END IF;

                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'Id') THEN ALTER TABLE public.customers RENAME COLUMN "Id" TO id; END IF;
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'Name') THEN ALTER TABLE public.customers RENAME COLUMN "Name" TO name; END IF;
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'HasReferral') THEN ALTER TABLE public.customers RENAME COLUMN "HasReferral" TO has_referral; END IF;
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'Referral') THEN ALTER TABLE public.customers RENAME COLUMN "Referral" TO referral; END IF;
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'CreatedAtUtc') THEN ALTER TABLE public.customers RENAME COLUMN "CreatedAtUtc" TO created_at_utc; END IF;

                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'loans' AND column_name = 'Id') THEN ALTER TABLE public.loans RENAME COLUMN "Id" TO id; END IF;
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'loans' AND column_name = 'CustomerId') THEN ALTER TABLE public.loans RENAME COLUMN "CustomerId" TO customer_id; END IF;
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'loans' AND column_name = 'PrincipalAmount') THEN ALTER TABLE public.loans RENAME COLUMN "PrincipalAmount" TO principal_amount; END IF;
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'loans' AND column_name = 'DueDay') THEN ALTER TABLE public.loans RENAME COLUMN "DueDay" TO due_day; END IF;
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'loans' AND column_name = 'MonthlyInterestRatePercent') THEN ALTER TABLE public.loans RENAME COLUMN "MonthlyInterestRatePercent" TO monthly_interest_rate_percent; END IF;
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'loans' AND column_name = 'LateDailyInterestRatePercent') THEN ALTER TABLE public.loans RENAME COLUMN "LateDailyInterestRatePercent" TO late_daily_interest_rate_percent; END IF;
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'loans' AND column_name = 'Status') THEN ALTER TABLE public.loans RENAME COLUMN "Status" TO status; END IF;
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'loans' AND column_name = 'CreatedAtUtc') THEN ALTER TABLE public.loans RENAME COLUMN "CreatedAtUtc" TO created_at_utc; END IF;

                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'loan_payments' AND column_name = 'Id') THEN ALTER TABLE public.loan_payments RENAME COLUMN "Id" TO id; END IF;
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'loan_payments' AND column_name = 'LoanId') THEN ALTER TABLE public.loan_payments RENAME COLUMN "LoanId" TO loan_id; END IF;
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'loan_payments' AND column_name = 'Type') THEN ALTER TABLE public.loan_payments RENAME COLUMN "Type" TO type; END IF;
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'loan_payments' AND column_name = 'Amount') THEN ALTER TABLE public.loan_payments RENAME COLUMN "Amount" TO amount; END IF;
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'loan_payments' AND column_name = 'InterestAmount') THEN ALTER TABLE public.loan_payments RENAME COLUMN "InterestAmount" TO interest_amount; END IF;
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'loan_payments' AND column_name = 'PrincipalAmount') THEN ALTER TABLE public.loan_payments RENAME COLUMN "PrincipalAmount" TO principal_amount; END IF;
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'loan_payments' AND column_name = 'PaidAtUtc') THEN ALTER TABLE public.loan_payments RENAME COLUMN "PaidAtUtc" TO paid_at_utc; END IF;
            END $$;

            ALTER TABLE public.users ADD COLUMN IF NOT EXISTS account_id uuid;
            ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at_utc timestamp without time zone NOT NULL DEFAULT (timezone('utc', now()));
            ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS use_custom_theme boolean NOT NULL DEFAULT false;
            ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS primary_color varchar(7) NOT NULL DEFAULT '#071629';
            ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS secondary_color varchar(7) NOT NULL DEFAULT '#D4A64A';
            ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS is_dark_mode boolean NOT NULL DEFAULT false;
            ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS account_id uuid;
            ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS module varchar(40);
            ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS account_id uuid;
            ALTER TABLE public.loan_payments ADD COLUMN IF NOT EXISTS account_id uuid;

            UPDATE public.customers SET module = 'Loans' WHERE module IS NULL;

            CREATE TABLE IF NOT EXISTS public.party_themes (
                id uuid PRIMARY KEY,
                account_id uuid NOT NULL,
                name varchar(160) NOT NULL,
                description varchar(240),
                created_at_utc timestamp without time zone NOT NULL DEFAULT (timezone('utc', now()))
            );

            CREATE TABLE IF NOT EXISTS public.party_events (
                id uuid PRIMARY KEY,
                account_id uuid NOT NULL,
                customer_id uuid NOT NULL,
                theme_id uuid,
                event_date timestamp without time zone NOT NULL,
                total_amount numeric(18,2) NOT NULL,
                deposit_received boolean NOT NULL DEFAULT false,
                deposit_amount numeric(18,2) NOT NULL DEFAULT 0,
                notes varchar(500),
                status varchar(30) NOT NULL DEFAULT 'Scheduled',
                created_at_utc timestamp without time zone NOT NULL DEFAULT (timezone('utc', now()))
            );

            CREATE TABLE IF NOT EXISTS public.finance_entries (
                id uuid PRIMARY KEY,
                account_id uuid NOT NULL,
                type varchar(20) NOT NULL,
                amount numeric(18,2) NOT NULL,
                entry_date timestamp without time zone NOT NULL,
                category varchar(120) NOT NULL,
                description varchar(240),
                created_at_utc timestamp without time zone NOT NULL DEFAULT (timezone('utc', now()))
            );

            CREATE TABLE IF NOT EXISTS public.products (
                id uuid PRIMARY KEY,
                account_id uuid NOT NULL,
                name varchar(160) NOT NULL,
                brand varchar(120) NOT NULL,
                price numeric(18,2) NOT NULL,
                created_at_utc timestamp without time zone NOT NULL DEFAULT (timezone('utc', now()))
            );

            CREATE TABLE IF NOT EXISTS public.sales (
                id uuid PRIMARY KEY,
                account_id uuid NOT NULL,
                customer_id uuid NOT NULL,
                product_id uuid NOT NULL,
                payment_type varchar(20) NOT NULL,
                amount numeric(18,2) NOT NULL,
                due_date timestamp without time zone,
                status varchar(20) NOT NULL,
                sold_at_utc timestamp without time zone NOT NULL DEFAULT (timezone('utc', now())),
                paid_at_utc timestamp without time zone
            );

            INSERT INTO public.accounts (id, name, module)
            SELECT gen_random_uuid(), 'Conta de empréstimos', 'Loans'
            WHERE EXISTS (SELECT 1 FROM public.users WHERE account_id IS NULL)
              AND NOT EXISTS (SELECT 1 FROM public.accounts);

            INSERT INTO public.account_modules (id, account_id, module)
            SELECT gen_random_uuid(), accounts.id, accounts.module
            FROM public.accounts
            WHERE NOT EXISTS (
                SELECT 1 FROM public.account_modules
                WHERE account_modules.account_id = accounts.id
                  AND account_modules.module = accounts.module
            );

            UPDATE public.users
            SET account_id = (SELECT id FROM public.accounts LIMIT 1)
            WHERE account_id IS NULL;

            UPDATE public.customers
            SET account_id = (SELECT account_id FROM public.users WHERE account_id IS NOT NULL LIMIT 1)
            WHERE account_id IS NULL;

            UPDATE public.loans
            SET account_id = (SELECT account_id FROM public.users WHERE account_id IS NOT NULL LIMIT 1)
            WHERE account_id IS NULL;

            UPDATE public.loan_payments
            SET account_id = (SELECT account_id FROM public.users WHERE account_id IS NOT NULL LIMIT 1)
            WHERE account_id IS NULL;
            """;

        await context.Database.ExecuteSqlRawAsync(sql, cancellationToken);
    }
}
