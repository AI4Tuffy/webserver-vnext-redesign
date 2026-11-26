import { Navigate, useLocation } from 'react-router'
import { DataState, PageShell, SplitWorkspace } from '../../shared'
import { useVNextPageTitle } from '../../shared/useVNextPageTitle'
import { ProfileActivityHeatmap } from './ProfileActivityHeatmap'
import { ProfileGrowthChart } from './ProfileGrowthChart'
import { ProfileHistory } from './ProfileHistory'
import { ProfileFacts, ProfileIdentity } from './ProfileIdentity'
import { ProfileSkillMap } from './ProfileSkillMap'
import styles from './UserProfilePage.module.css'
import { useUserProfileController } from './useUserProfileController'

export function UserProfilePage() {
  const location = useLocation()
  const controller = useUserProfileController()
  useVNextPageTitle(controller.profile?.userName ? `${controller.profile.userName} 的个人主页` : '个人主页')

  if (controller.isMeRoute && !controller.resolvedUserId && controller.account.error) {
    return <Navigate replace to="/account/login?returnUrl=%2Fusers%2Fme" />
  }
  if (controller.isMeRoute && controller.resolvedUserId) {
    return <Navigate replace to={`/users/${controller.resolvedUserId}${location.search}`} />
  }
  if (!controller.resolvedUserId || controller.profileLoading || controller.overviewLoading) {
    return (
      <PageShell>
        <DataState loading title="个人主页加载中" />
      </PageShell>
    )
  }
  if (controller.profileError || controller.overviewError || !controller.profile || !controller.overview) {
    return (
      <PageShell>
        <DataState description="用户不存在，或个人统计暂时无法读取。" title="无法打开个人主页" />
      </PageShell>
    )
  }

  return (
    <PageShell>
      <ProfileIdentity isOwnProfile={controller.isOwnProfile} profile={controller.profile} />
      <SplitWorkspace
        asideWidth="narrow"
        aside={
          <ProfileFacts
            isOwnProfile={controller.isOwnProfile}
            metrics={controller.overview.metrics}
            privateOverview={controller.privateOverview}
            profile={controller.profile}
          />
        }
      >
        <div className={styles.profileMain}>
          <div ref={controller.activityRef}>
            <ProfileActivityHeatmap
              failed={Boolean(controller.activityError)}
              from={controller.range.from}
              loading={controller.activityLoading}
              points={controller.activity}
              to={controller.range.to}
            />
          </div>
          <ProfileSkillMap dimensions={controller.overview.dimensions} />
          <ProfileGrowthChart trend={controller.overview.trend} />
          <div ref={controller.historyRef}>
            <ProfileHistory
              failed={Boolean(controller.historyError)}
              hasMore={controller.hasMoreHistory}
              items={controller.historyItems}
              loading={controller.historyLoading}
              loadingMore={controller.historyLoadingMore}
              onLoadMore={controller.loadMoreHistory}
            />
          </div>
        </div>
      </SplitWorkspace>
    </PageShell>
  )
}
