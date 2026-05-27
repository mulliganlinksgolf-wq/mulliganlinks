import { describe, it, expect } from 'vitest'

function checkCourseAccess(opts: {
  isGlobalAdmin: boolean
  inCourseAdmins: boolean
  inCrmCourseUsers: boolean
}): boolean {
  return opts.isGlobalAdmin || opts.inCourseAdmins || opts.inCrmCourseUsers
}

describe('course portal access logic', () => {
  it('allows global admin with no course record', () => {
    expect(checkCourseAccess({ isGlobalAdmin: true, inCourseAdmins: false, inCrmCourseUsers: false })).toBe(true)
  })
  it('allows user in course_admins', () => {
    expect(checkCourseAccess({ isGlobalAdmin: false, inCourseAdmins: true, inCrmCourseUsers: false })).toBe(true)
  })
  it('allows user in crm_course_users', () => {
    expect(checkCourseAccess({ isGlobalAdmin: false, inCourseAdmins: false, inCrmCourseUsers: true })).toBe(true)
  })
  it('denies user with no association', () => {
    expect(checkCourseAccess({ isGlobalAdmin: false, inCourseAdmins: false, inCrmCourseUsers: false })).toBe(false)
  })
})
