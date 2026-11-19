using Microsoft.EntityFrameworkCore;
using MoneyDoPaizao.Domain.Entities;
using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Infrastructure.Persistence;

public sealed class MoneyDoPaizaoDbContext(DbContextOptions<MoneyDoPaizaoDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<AccountModule> AccountModules => Set<AccountModule>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Loan> Loans => Set<Loan>();
    public DbSet<LoanPayment> LoanPayments => Set<LoanPayment>();
    public DbSet<PartyTheme> PartyThemes => Set<PartyTheme>();
    public DbSet<PartyEvent> PartyEvents => Set<PartyEvent>();
    public DbSet<FinanceEntry> FinanceEntries => Set<FinanceEntry>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Sale> Sales => Set<Sale>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var account = modelBuilder.Entity<Account>();
        account.ToTable("accounts");
        account.HasKey(item => item.Id);
        account.Property(item => item.Name).HasMaxLength(160).IsRequired();
        account.Property(item => item.Module).HasConversion<string>().HasMaxLength(40).IsRequired();
        account.Property(item => item.UseCustomTheme).IsRequired();
        account.Property(item => item.PrimaryColor).HasMaxLength(7).IsRequired();
        account.Property(item => item.SecondaryColor).HasMaxLength(7).IsRequired();
        account.Property(item => item.IsDarkMode).IsRequired();

        var accountModule = modelBuilder.Entity<AccountModule>();
        accountModule.ToTable("account_modules");
        accountModule.HasKey(item => item.Id);
        accountModule.Property(item => item.Module).HasConversion<string>().HasMaxLength(40).IsRequired();
        accountModule.Property(item => item.Active).IsRequired();
        accountModule.HasIndex(item => new { item.AccountId, item.Module }).IsUnique();
        accountModule.HasOne(item => item.Account).WithMany(item => item.Modules).HasForeignKey(item => item.AccountId).OnDelete(DeleteBehavior.Cascade);

        var user = modelBuilder.Entity<User>();

        user.ToTable("users");
        user.HasKey(item => item.Id);
        user.Property(item => item.Name).HasMaxLength(160).IsRequired();
        user.Property(item => item.Email).HasMaxLength(180).IsRequired();
        user.Property(item => item.Cpf).HasMaxLength(11).IsRequired();
        user.Property(item => item.BirthDate).HasColumnType("timestamp without time zone").IsRequired();
        user.Property(item => item.PasswordHash).IsRequired();
        user.Property(item => item.Role).HasConversion<string>().HasMaxLength(20).IsRequired();
        user.HasIndex(item => item.Email).IsUnique();
        user.HasIndex(item => item.Cpf).IsUnique();
        user.HasOne(item => item.Account).WithMany().HasForeignKey(item => item.AccountId).OnDelete(DeleteBehavior.Restrict);

        var customer = modelBuilder.Entity<Customer>();
        customer.ToTable("customers");
        customer.HasKey(item => item.Id);
        customer.Property(item => item.Name).HasMaxLength(160).IsRequired();
        customer.Property(item => item.Referral).HasMaxLength(160);
        customer.Property(item => item.AccountId).IsRequired();
        customer.Property(item => item.Module).HasConversion<string>().HasMaxLength(40).IsRequired();

        var loan = modelBuilder.Entity<Loan>();
        loan.ToTable("loans");
        loan.HasKey(item => item.Id);
        loan.Property(item => item.PrincipalAmount).HasPrecision(18, 2).IsRequired();
        loan.Property(item => item.MonthlyInterestRatePercent).HasPrecision(8, 4).IsRequired();
        loan.Property(item => item.LateDailyInterestRatePercent).HasPrecision(8, 4).IsRequired();
        loan.Property(item => item.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        loan.Property(item => item.AccountId).IsRequired();
        loan.HasOne(item => item.Customer)
            .WithMany(item => item.Loans)
            .HasForeignKey(item => item.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        var payment = modelBuilder.Entity<LoanPayment>();
        payment.ToTable("loan_payments");
        payment.HasKey(item => item.Id);
        payment.Property(item => item.Type).HasConversion<string>().HasMaxLength(20).IsRequired();
        payment.Property(item => item.Amount).HasPrecision(18, 2).IsRequired();
        payment.Property(item => item.InterestAmount).HasPrecision(18, 2).IsRequired();
        payment.Property(item => item.PrincipalAmount).HasPrecision(18, 2).IsRequired();
        payment.Property(item => item.AccountId).IsRequired();
        payment.HasOne(item => item.Loan)
            .WithMany(item => item.Payments)
            .HasForeignKey(item => item.LoanId)
            .OnDelete(DeleteBehavior.Cascade);

        var theme = modelBuilder.Entity<PartyTheme>();
        theme.ToTable("party_themes");
        theme.HasKey(item => item.Id);
        theme.Property(item => item.AccountId).IsRequired();
        theme.Property(item => item.Name).HasMaxLength(160).IsRequired();
        theme.Property(item => item.Description).HasMaxLength(240);

        var partyEvent = modelBuilder.Entity<PartyEvent>();
        partyEvent.ToTable("party_events");
        partyEvent.HasKey(item => item.Id);
        partyEvent.Property(item => item.AccountId).IsRequired();
        partyEvent.Property(item => item.EventDate).HasColumnType("timestamp without time zone").IsRequired();
        partyEvent.Property(item => item.TotalAmount).HasPrecision(18, 2).IsRequired();
        partyEvent.Property(item => item.DepositAmount).HasPrecision(18, 2).IsRequired();
        partyEvent.Property(item => item.Notes).HasMaxLength(500);
        partyEvent.Property(item => item.Status).HasMaxLength(30).IsRequired();
        partyEvent.HasOne(item => item.Customer).WithMany().HasForeignKey(item => item.CustomerId).OnDelete(DeleteBehavior.Restrict);
        partyEvent.HasOne(item => item.Theme).WithMany().HasForeignKey(item => item.ThemeId).OnDelete(DeleteBehavior.SetNull);

        var financeEntry = modelBuilder.Entity<FinanceEntry>();
        financeEntry.ToTable("finance_entries");
        financeEntry.HasKey(item => item.Id);
        financeEntry.Property(item => item.AccountId).IsRequired();
        financeEntry.Property(item => item.Type).HasConversion<string>().HasMaxLength(20).IsRequired();
        financeEntry.Property(item => item.Amount).HasPrecision(18, 2).IsRequired();
        financeEntry.Property(item => item.EntryDate).HasColumnType("timestamp without time zone").IsRequired();
        financeEntry.Property(item => item.Category).HasMaxLength(120).IsRequired();
        financeEntry.Property(item => item.Description).HasMaxLength(240);

        var product = modelBuilder.Entity<Product>();
        product.ToTable("products");
        product.HasKey(item => item.Id);
        product.Property(item => item.AccountId).IsRequired();
        product.Property(item => item.Name).HasMaxLength(160).IsRequired();
        product.Property(item => item.Brand).HasMaxLength(120).IsRequired();
        product.Property(item => item.Price).HasPrecision(18, 2).IsRequired();

        var sale = modelBuilder.Entity<Sale>();
        sale.ToTable("sales");
        sale.HasKey(item => item.Id);
        sale.Property(item => item.AccountId).IsRequired();
        sale.Property(item => item.PaymentType).HasConversion<string>().HasMaxLength(20).IsRequired();
        sale.Property(item => item.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        sale.Property(item => item.Amount).HasPrecision(18, 2).IsRequired();
        sale.Property(item => item.DueDate).HasColumnType("timestamp without time zone");
        sale.HasOne(item => item.Customer).WithMany().HasForeignKey(item => item.CustomerId).OnDelete(DeleteBehavior.Restrict);
        sale.HasOne(item => item.Product).WithMany().HasForeignKey(item => item.ProductId).OnDelete(DeleteBehavior.Restrict);
    }
}
