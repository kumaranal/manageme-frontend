import { useOrg, usePermissions } from '@/hooks/useScope';
import { Button } from '@/components/ui/Button';
import { useDataStore } from '@/store/dataStore';

export default function OrgSettings() {
  const org = useOrg();
  const { isOrgAdmin } = usePermissions();
  const getGitInstallUrl = useDataStore((s) => s.getGitInstallUrl);
  const disconnectGit = useDataStore((s) => s.disconnectGit);

  if (!org) return null;

  const connectGithub = async () => {
    const url = await getGitInstallUrl(org.id);
    if (url) window.location.href = url;
  };

  return (
    <div className="flex flex-col gap-4 max-w-[820px]">
      <div className="bg-neutral-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-4 sm:px-6 pt-4 pb-3">
          <div className="font-heading text-xl">GitHub connection</div>
          <div className="text-[12.5px] text-neutral-600 mt-0.5">
            Connect a GitHub account so project leads can link repositories and members can create branches straight from a ticket.
          </div>
        </div>
        {!isOrgAdmin ? (
          <div className="px-4 sm:px-6 py-4 border-t border-line text-[13.5px] text-neutral-600">
            Only an org admin can manage the GitHub connection.
          </div>
        ) : org.gitConnection ? (
          <div className="flex flex-wrap items-center gap-4 px-4 sm:px-6 py-4 border-t border-line">
            <div className="flex-1 min-w-[200px]">
              <div className="text-sm font-semibold">{org.gitConnection.accountLogin}</div>
              <div className="text-[12.5px] text-neutral-600">
                Connected {org.gitConnection.accountType === 'Organization' ? 'GitHub organization' : 'GitHub account'}
              </div>
            </div>
            <Button
              variant="danger"
              onClick={() => {
                if (confirm('Disconnecting removes every project’s linked repository. Continue?')) {
                  disconnectGit(org.id);
                }
              }}
            >
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4 px-4 sm:px-6 py-4 border-t border-line">
            <div className="flex-1 min-w-[200px] text-[13.5px] text-neutral-600">
              No GitHub account connected yet.
            </div>
            <Button variant="primary" onClick={connectGithub}>Connect GitHub</Button>
          </div>
        )}
      </div>
    </div>
  );
}
