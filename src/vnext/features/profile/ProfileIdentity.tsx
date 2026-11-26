import { CalendarDays, Edit3, GraduationCap, Users } from 'lucide-react'
import { Link } from 'react-router'
import {
  ActionLink,
  EditorialPlate,
  HairlineItem,
  HairlineList,
  PageHeader,
  SectionHeader,
  SpecItem,
  SpecStrip,
  StatusBadge,
  SurfaceCard,
} from '../../shared'
import { roleLabel } from '../account/useCurrentAccount'
import { ProfileJournalArt } from './ProfileJournalArt'
import styles from './UserProfilePage.module.css'
import type { PublicUserProfile, UserPrivateOverview, UserProfileMetrics } from './api/userProfileApi'

function initials(value: string) {
  return value.trim().slice(0, 2).toUpperCase() || 'YY'
}

function formatJoinDate(value: number) {
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long' }).format(value)
}

export function ProfileIdentity({ profile, isOwnProfile }: { profile: PublicUserProfile; isOwnProfile: boolean }) {
  return (
    <div className={styles.identityHero}>
      <span className={styles.profileAvatar}>
        <span className={styles.avatarFace}>
          {profile.avatar ? (
            <img alt="" className={styles.avatarImage} src={profile.avatar} />
          ) : (
            initials(profile.userName)
          )}
        </span>
      </span>
      <PageHeader
        actions={
          isOwnProfile ? (
            <ActionLink icon={<Edit3 size={16} />} shape="pill" to="/settings/profile">
              编辑资料
            </ActionLink>
          ) : undefined
        }
        border={false}
        description={
          <span className={styles.identityDetails}>
            <span>{profile.bio || '这位用户还没有填写公开简介。'}</span>
            <span className={styles.identityTags}>
              <StatusBadge>{roleLabel(profile.role)}</StatusBadge>
              {profile.publicTeam && (
                <Link className={styles.teamLink} to={`/teams?team=${profile.publicTeam.id}`}>
                  <Users size={14} />
                  {profile.publicTeam.name}
                </Link>
              )}
              <span className={styles.joinDate}>
                <CalendarDays size={14} />
                {formatJoinDate(profile.registeredAt)}加入平台
              </span>
            </span>
          </span>
        }
        illustration={
          <EditorialPlate alt="个人档案年代拼贴插图" slot="profile-journal">
            <ProfileJournalArt />
          </EditorialPlate>
        }
        title={profile.userName}
      />
    </div>
  )
}

export function ProfileFacts({
  profile,
  metrics,
  privateOverview,
  isOwnProfile,
}: {
  profile: PublicUserProfile
  metrics: UserProfileMetrics
  privateOverview?: UserPrivateOverview
  isOwnProfile: boolean
}) {
  return (
    <div className={styles.factsRail}>
      <SurfaceCard>
        <SectionHeader title="身份信息" />
        <dl className={styles.factList}>
          <dt>平台角色</dt>
          <dd className={styles.factValue}>{roleLabel(profile.role)}</dd>
          <dt>加入时间</dt>
          <dd className={styles.factValue}>{formatJoinDate(profile.registeredAt)}</dd>
          <dt>公开战队</dt>
          <dd className={styles.factValue}>
            {profile.publicTeam ? (
              <Link className={styles.teamLink} to={`/teams?team=${profile.publicTeam.id}`}>
                {profile.publicTeam.name}
              </Link>
            ) : (
              '暂无'
            )}
          </dd>
        </dl>
      </SurfaceCard>
      {profile.taughtCourses.length > 0 && (
        <SurfaceCard>
          <SectionHeader title="授课课程" />
          <HairlineList aria-label="授课课程">
            {profile.taughtCourses.map((course) => (
              <HairlineItem
                key={course.id}
                leading={<GraduationCap size={16} />}
                title={course.title}
                to={`/training/courses/${course.id}`}
              />
            ))}
          </HairlineList>
        </SurfaceCard>
      )}
      <SurfaceCard>
        <SectionHeader title={isOwnProfile ? '我的学习摘要' : '学习摘要'} />
        <SpecStrip className={styles.metrics}>
          <SpecItem label="参赛场次" value={metrics.gameCount} />
          <SpecItem label="课程" value={metrics.courseCount} />
          <SpecItem label="活跃天数" value={metrics.activeDays} />
        </SpecStrip>
        {isOwnProfile && privateOverview && (
          <>
            <p className={styles.privateNote}>本区仅本人可见</p>
            <SpecStrip className={styles.metrics}>
              <SpecItem label="学习中" value={privateOverview.learningCourses} />
              <SpecItem label="已完成" value={privateOverview.completedCourses} />
              <SpecItem label="理论交卷" value={privateOverview.submittedTheoryAssignments} />
            </SpecStrip>
          </>
        )}
      </SurfaceCard>
    </div>
  )
}
