using Microsoft.EntityFrameworkCore;
using MoneyDoPaizao.Domain.Entities;

namespace MoneyDoPaizao.Infrastructure.Persistence;

public sealed class MoneyDoPaizaoDbContext(DbContextOptions<MoneyDoPaizaoDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Loan> Loans => Set<Loan>();
    public DbSet<LoanPayment> LoanPayments => Set<LoanPayment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
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

        var customer = modelBuilder.Entity<Customer>();
        customer.ToTable("customers");
        customer.HasKey(item => item.Id);
        customer.Property(item => item.Name).HasMaxLength(160).IsRequired();
        customer.Property(item => item.Referral).HasMaxLength(160);

        var loan = modelBuilder.Entity<Loan>();
        loan.ToTable("loans");
        loan.HasKey(item => item.Id);
        loan.Property(item => item.PrincipalAmount).HasPrecision(18, 2).IsRequired();
        loan.Property(item => item.MonthlyInterestRatePercent).HasPrecision(8, 4).IsRequired();
        loan.Property(item => item.LateDailyInterestRatePercent).HasPrecision(8, 4).IsRequired();
        loan.Property(item => item.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
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
        payment.HasOne(item => item.Loan)
            .WithMany(item => item.Payments)
            .HasForeignKey(item => item.LoanId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
