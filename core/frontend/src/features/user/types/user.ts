export type CreateUserItem = {
	email: string;
	firstName: string;
	lastName: string;
	phone?: string;
	password: string;
	organizationId: string;
	branchIds: string[];
	roleIds: string[];  
}
