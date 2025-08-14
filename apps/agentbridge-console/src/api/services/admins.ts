import { Admin, UpdateAdminRequest, WaitlistService } from "@agentbridge/api";

import { AdminManagementService } from "@agentbridge/api";
import { trackTapfiliateConversion } from "../../utils/analytics";
import { apiCallSucceeded, ApiClientOptions, apiResultToError } from "../api-options";

export const AdminsAPIService = {
  getAdmins: async (): Promise<Admin[]> => {
    const res = await AdminManagementService.adminListAdmins(ApiClientOptions);
    if (apiCallSucceeded(res)) {
      return res.body;
    }
    throw apiResultToError(res);
  },
  addToWaitlist: async (email: string, easterEggBypass = false): Promise<{ message?: string } | null> => {
    const response = await WaitlistService.adminAddToWaitlist(ApiClientOptions, {
      requestBody: {
        email,
        easterEggBypass,
      },
    });

    const success = apiCallSucceeded(response);
    if (success) {
      trackTapfiliateConversion();
    }
    return success ? response.body : null;
  },
  enableAdmin: async (adminId: string, enabled: boolean, token?: string, sendNotification = false): Promise<Admin> => {
    const res = await AdminManagementService.putApiAdminsEnable(ApiClientOptions, {
      pathParams: { adminId },
      requestBody: {
        enabled,
        token,
        sendNotification,
      },
    });
    if (apiCallSucceeded(res)) {
      return res.body;
    }
    throw apiResultToError(res);
  },
  updateAdmin: async (adminId: string, updates: UpdateAdminRequest): Promise<Admin> => {
    const res = await AdminManagementService.putApiAdmins(ApiClientOptions, {
      pathParams: { adminId },
      requestBody: updates,
    });
    if (apiCallSucceeded(res)) {
      return res.body;
    }
    throw apiResultToError(res);
  },
  sendAdminApprovedNotification: async (adminId: string): Promise<Admin> => {
    const res = await AdminManagementService.postApiAdminsSendApprovedNotification(ApiClientOptions, {
      pathParams: { adminId },
    });
    if (apiCallSucceeded(res)) {
      return res.body;
    }
    throw apiResultToError(res);
  },
};
