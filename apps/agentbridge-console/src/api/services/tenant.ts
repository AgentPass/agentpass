import { apiCallSucceeded, ApiClientOptions, apiResultToError } from "@/api/api-options.ts";
import {
  AcceptInvitationRequest,
  AcceptInvitationResponse,
  CreateInvitationRequest,
  TenantInvitation,
  TenantManagementService,
  TenantRole,
  TenantUser,
  UserTenant,
} from "@agentbridge/api";

export const TenantAPIService = {
  getTenantUsers: async (): Promise<TenantUser[]> => {
    const res = await TenantManagementService.tenantListUsers(ApiClientOptions);
    if (apiCallSucceeded(res)) {
      return res.body;
    }
    throw apiResultToError(res);
  },

  getTenantInvitations: async (): Promise<TenantInvitation[]> => {
    const res = await TenantManagementService.tenantListInvitations(ApiClientOptions);
    if (apiCallSucceeded(res)) {
      return res.body;
    }
    throw apiResultToError(res);
  },

  createInvitation: async (request: CreateInvitationRequest): Promise<TenantInvitation> => {
    const res = await TenantManagementService.tenantCreateInvitation(ApiClientOptions, {
      requestBody: request,
    });
    if (apiCallSucceeded(res)) {
      return res.body;
    }
    throw apiResultToError(res);
  },

  acceptInvitation: async (request: AcceptInvitationRequest): Promise<AcceptInvitationResponse> => {
    const res = await TenantManagementService.acceptInvitation(ApiClientOptions, {
      requestBody: request,
    });
    if (apiCallSucceeded(res)) {
      return res.body;
    }
    throw apiResultToError(res);
  },

  updateUserRole: async (userId: string, role: TenantRole): Promise<TenantUser> => {
    const res = await TenantManagementService.tenantUpdateUserRole(ApiClientOptions, {
      pathParams: { userId },
      requestBody: { role },
    });
    if (apiCallSucceeded(res)) {
      return res.body;
    }
    throw apiResultToError(res);
  },

  removeUserFromTenant: async (userId: string): Promise<void> => {
    const res = await TenantManagementService.tenantRemoveUser(ApiClientOptions, {
      pathParams: { userId },
    });
    if (apiCallSucceeded(res)) {
      return;
    }
    throw apiResultToError(res);
  },

  cancelInvitation: async (invitationId: string): Promise<void> => {
    const res = await TenantManagementService.tenantCancelInvitation(ApiClientOptions, {
      pathParams: { invitationId },
    });
    if (apiCallSucceeded(res)) {
      return;
    }
    throw apiResultToError(res);
  },

  getUserTenants: async (): Promise<UserTenant[]> => {
    const res = await TenantManagementService.tenantGetUserTenants(ApiClientOptions);
    if (apiCallSucceeded(res)) {
      return res.body;
    }
    throw apiResultToError(res);
  },

  getInvitationByToken: async (token: string): Promise<TenantInvitation> => {
    const res = await TenantManagementService.getInvitationByToken(ApiClientOptions, {
      pathParams: { token },
    });
    if (apiCallSucceeded(res)) {
      return res.body as TenantInvitation;
    }
    throw apiResultToError(res);
  },
};
