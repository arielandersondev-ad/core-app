export type CreateBranch = {
  timezone: string
	state: string
	postalCode: string
	phone: string
	name: string
	email: string
	country: string
	code: string
	city: string
	addressLine1: string
	addressLine2: string
	longitude: number
	latitude: number
	organizationId:string
}
export type Branch = CreateBranch &{
	id: string
	status: string
	deleted: boolean
	deletedAt: string
	updatedAt: string
	createdAt: string
}
export type branchMinimalList = {
	id: string
	name: string
	code: string
}