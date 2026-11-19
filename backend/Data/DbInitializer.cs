using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using SltCommunicationSystem.Api.Models.Entities;

namespace SltCommunicationSystem.Api.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(AppDbContext context)
    {
        // ─── 1. Roles ────────────────────────────────────────────────────────
        var roleNames = new[]
        {
            ("ADMIN",                "System Administrator with full access"),
            ("DGM",                  "Deputy General Manager overseeing department projects"),
            ("HIGHER_MANAGEMENT",    "Executive leadership with cross-department visibility"),
            ("DIGITAL_LAB_USER",     "Digital Lab team member driving R&D and digital solutions"),
            ("NON_DIGITAL_LAB_USER", "General department member collaborating on projects")
        };

        var roleMap = new Dictionary<string, Role>();
        foreach (var (name, desc) in roleNames)
        {
            var role = await context.Roles.FirstOrDefaultAsync(r => r.Name == name);
            if (role == null)
            {
                role = new Role { Name = name, Description = desc, CreatedAt = DateTime.UtcNow };
                context.Roles.Add(role);
            }
            roleMap[name] = role;
        }
        await context.SaveChangesAsync();

        // ─── 2. Departments ──────────────────────────────────────────────────
        var departments = new[]
        {
            new Department { Code = "IT-DGL",   Name = "Digital Lab & Innovation",             Description = "SLT Digital Transformation, Software Engineering & Research Lab", IsActive = true, CreatedAt = DateTime.UtcNow },
            new Department { Code = "NET-OPS",  Name = "Network Operations & Infrastructure",  Description = "Core network, transmission, and operational maintenance",           IsActive = true, CreatedAt = DateTime.UtcNow },
            new Department { Code = "ENT-BIZ",  Name = "Enterprise Business Solutions",        Description = "Corporate solutions, government contracts, and enterprise relations",IsActive = true, CreatedAt = DateTime.UtcNow },
            new Department { Code = "HR-CORP",  Name = "Corporate Human Resources",            Description = "Talent acquisition, employee training, and organizational culture",  IsActive = true, CreatedAt = DateTime.UtcNow },
            new Department { Code = "FIN-MGMT", Name = "Finance & Budgeting",                  Description = "Financial planning, accounting, and capital expenditure review",     IsActive = true, CreatedAt = DateTime.UtcNow },
            new Department { Code = "SLT-CORP", Name = "SLT Corporate Office",                 Description = "Corporate head office – used for system-level accounts",            IsActive = true, CreatedAt = DateTime.UtcNow }
        };

        var deptMap = new Dictionary<string, Department>();
        foreach (var dept in departments)
        {
            var existing = await context.Departments.FirstOrDefaultAsync(d => d.Code == dept.Code);
            if (existing == null)
            {
                context.Departments.Add(dept);
                deptMap[dept.Code] = dept;
            }
            else
            {
                deptMap[dept.Code] = existing;
            }
        }
        await context.SaveChangesAsync();

        // ─── 3. Permanent System Accounts (Admin-managed, non-self-registerable) ──
        await SeedSystemAccountAsync(context, deptMap, roleMap,
            username:     "slt.admin",
            email:        "admin@system.slt.internal",
            fullName:     "SLT System Administrator",
            password:     "Admin@SLT2026!",
            deptCode:     "SLT-CORP",
            roleName:     "ADMIN",
            isDemoAccount: false);

        await SeedSystemAccountAsync(context, deptMap, roleMap,
            username:     "slt.dgm",
            email:        "dgm@system.slt.internal",
            fullName:     "SLT Deputy General Manager",
            password:     "DGM@SLT2026!",
            deptCode:     "SLT-CORP",
            roleName:     "DGM",
            isDemoAccount: false);

        await SeedSystemAccountAsync(context, deptMap, roleMap,
            username:     "slt.management",
            email:        "management@system.slt.internal",
            fullName:     "SLT Higher Management",
            password:     "Mgmt@SLT2026!",
            deptCode:     "SLT-CORP",
            roleName:     "HIGHER_MANAGEMENT",
            isDemoAccount: false);

        // ─── 4. Demo Test Accounts (clearly flagged, fictional credentials) ──
        await SeedSystemAccountAsync(context, deptMap, roleMap,
            username:     "demo.digitallab",
            email:        "demo.digitallab@test.slt.internal",
            fullName:     "Demo Digital Lab Specialist (Test Account)",
            password:     "DemoDigitalLab@2026!",
            deptCode:     "IT-DGL",
            roleName:     "DIGITAL_LAB_USER",
            isDemoAccount: true);

        await SeedSystemAccountAsync(context, deptMap, roleMap,
            username:     "demo.nondigitallab",
            email:        "demo.nondigitallab@test.slt.internal",
            fullName:     "Demo Network Operations Officer (Test Account)",
            password:     "DemoNonDigitalLab@2026!",
            deptCode:     "NET-OPS",
            roleName:     "NON_DIGITAL_LAB_USER",
            isDemoAccount: true);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private static async Task SeedSystemAccountAsync(
        AppDbContext context,
        Dictionary<string, Department> deptMap,
        Dictionary<string, Role> roleMap,
        string username, string email, string fullName, string password,
        string deptCode, string roleName, bool isDemoAccount)
    {
        var existing = await context.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Username == username);

        if (existing != null) return; // already seeded

        var dept = deptMap[deptCode];
        var role = roleMap[roleName];

        var (hash, salt) = HashPassword(password);
        var user = new User
        {
            Username      = username,
            Email         = email,
            FullName      = fullName,
            DepartmentId  = dept.Id,
            PasswordHash  = hash,
            PasswordSalt  = salt,
            IsDemoAccount = isDemoAccount,
            IsActive      = true,
            CreatedAt     = DateTime.UtcNow
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        context.UserRoles.Add(new UserRole
        {
            UserId     = user.Id,
            RoleId     = role.Id,
            AssignedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Cryptographically secure PBKDF2-SHA256 password hash with unique salt.
    /// Never stores or logs plaintext passwords.
    /// </summary>
    public static (string Hash, string Salt) HashPassword(string password)
    {
        byte[] saltBytes = RandomNumberGenerator.GetBytes(16);
        byte[] hashBytes = Rfc2898DeriveBytes.Pbkdf2(
            password, saltBytes, iterations: 100_000, HashAlgorithmName.SHA256, outputLength: 32);
        return (Convert.ToBase64String(hashBytes), Convert.ToBase64String(saltBytes));
    }
}
