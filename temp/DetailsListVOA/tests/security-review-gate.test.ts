import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('security review gate: SvtGetUserContext', () => {
  const source = readRepoFile('VOA.SVT.Plugins/Plugins/CustomAPI/SvtGetUserContext.cs');

  test('uses InitiatingUserId as caller identity source', () => {
    expect(source).toMatch(/var\s+userId\s*=\s*context\.InitiatingUserId\s*;/);
  });

  test('does not accept identity from InputParameters', () => {
    expect(source).not.toMatch(/\bInputParameters\b/);
  });

  test('passes initiating identity to UserContextResolver', () => {
    expect(source).toMatch(
      /UserContextResolver\.Resolve\([\s\S]*localPluginContext\.SystemUserService,\s*userId,\s*trace[\s\S]*\)/,
    );
  });

  test('derives hasSvtAccess from resolved persona only', () => {
    expect(source).toMatch(
      /context\.OutputParameters\[OutputNames\.HasAccess\]\s*=\s*persona\s*!=\s*UserPersona\.None\s*;/,
    );
  });
});

describe('security review gate: UserContextResolver', () => {
  const source = readRepoFile('VOA.SVT.Plugins/Helpers/UserContextResolver.cs');

  test('restricts team lookup to security-group teams', () => {
    expect(source).toMatch(
      /qe\.Criteria\.AddCondition\("teamtype",\s*ConditionOperator\.Equal,\s*UserContextConfig\.TeamTypeSecurityGroup\)\s*;/,
    );
  });

  test('team allowlist includes only SVT Manager/QA/User team names', () => {
    expect(source).toMatch(
      /nameFilter\.AddCondition\("name",\s*ConditionOperator\.Equal,\s*UserContextConfig\.TeamNameSvtManager\)\s*;/,
    );
    expect(source).toMatch(
      /nameFilter\.AddCondition\("name",\s*ConditionOperator\.Equal,\s*UserContextConfig\.TeamNameSvtQa\)\s*;/,
    );
    expect(source).toMatch(
      /nameFilter\.AddCondition\("name",\s*ConditionOperator\.Equal,\s*UserContextConfig\.TeamNameSvtUser\)\s*;/,
    );
  });

  test('team membership join is constrained to requested userId', () => {
    expect(source).toMatch(
      /link\.LinkCriteria\.AddCondition\("systemuserid",\s*ConditionOperator\.Equal,\s*userId\)\s*;/,
    );
  });

  test('role allowlist includes only SVT Manager/QA/User role names', () => {
    expect(source).toMatch(
      /filter\.AddCondition\("name",\s*ConditionOperator\.Equal,\s*UserContextConfig\.RoleNameSvtManager\)\s*;/,
    );
    expect(source).toMatch(
      /filter\.AddCondition\("name",\s*ConditionOperator\.Equal,\s*UserContextConfig\.RoleNameSvtQa\)\s*;/,
    );
    expect(source).toMatch(
      /filter\.AddCondition\("name",\s*ConditionOperator\.Equal,\s*UserContextConfig\.RoleNameSvtUser\)\s*;/,
    );
  });

  test('role join is constrained to requested userId', () => {
    expect(source).toMatch(
      /link\.LinkCriteria\.AddCondition\("systemuserid",\s*ConditionOperator\.Equal,\s*userId\)\s*;/,
    );
  });

  test('team and role precedence stays Manager > QA > User', () => {
    const teamManager = source.indexOf('if (teamNames.Contains(UserContextConfig.TeamNameSvtManager))');
    const teamQa = source.indexOf('if (teamNames.Contains(UserContextConfig.TeamNameSvtQa))');
    const teamUser = source.indexOf('if (teamNames.Contains(UserContextConfig.TeamNameSvtUser))');

    expect(teamManager).toBeGreaterThan(-1);
    expect(teamQa).toBeGreaterThan(-1);
    expect(teamUser).toBeGreaterThan(-1);
    expect(teamManager).toBeLessThan(teamQa);
    expect(teamQa).toBeLessThan(teamUser);

    const roleManager = source.indexOf('if (roleNames.Contains(UserContextConfig.RoleNameSvtManager))');
    const roleQa = source.indexOf('if (roleNames.Contains(UserContextConfig.RoleNameSvtQa))');
    const roleUser = source.indexOf('if (roleNames.Contains(UserContextConfig.RoleNameSvtUser))');

    expect(roleManager).toBeGreaterThan(-1);
    expect(roleQa).toBeGreaterThan(-1);
    expect(roleUser).toBeGreaterThan(-1);
    expect(roleManager).toBeLessThan(roleQa);
    expect(roleQa).toBeLessThan(roleUser);
  });

  test('caseworker access requires explicit SVT User evidence', () => {
    expect(source).toContain('if (result.Persona == UserPersona.User) return true;');
    expect(source).toContain('UserContextConfig.TeamNameSvtUser');
    expect(source).toContain('UserContextConfig.RoleNameSvtUser');
    expect(source).toContain('result.MatchedTeamNames.Any');
    expect(source).toContain('result.MatchedRoleNames.Any');
  });
});

describe('security review gate: Grid UI surface', () => {
  const source = readRepoFile('DetailsListVOA/Grid.tsx');

  test('does not use dangerous HTML/script injection APIs', () => {
    expect(source).not.toMatch(/\bdangerouslySetInnerHTML\b/);
    expect(source).not.toMatch(/\.innerHTML\s*=/);
    expect(source).not.toMatch(/\beval\s*\(/);
    expect(source).not.toMatch(/\bnew\s+Function\s*\(/);
  });

  test('keeps input sanitizers wired for key search fields', () => {
    expect(source).toContain('sanitizeAlphaNumHyphen(v, ID_FIELD_MAX_LENGTH)');
    expect(source).toContain('sanitizeTaskIdInput(v, ID_FIELD_MAX_LENGTH)');
    expect(source).toContain('sanitizeDigits(v, UPRN_MAX_LENGTH)');
  });
});
