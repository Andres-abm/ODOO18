/** @odoo-module **/

import { SwitchCompanyMenu } from "@web/webclient/switch_company_menu/switch_company_menu";
import { patch } from "@web/core/utils/patch";
import { useService } from "@web/core/utils/hooks";
import { session } from "@web/session";

patch(SwitchCompanyMenu.prototype, {
    setup() {
        super.setup(...arguments);
        this.orm = useService("orm");
        this.notification = useService("notification");
        this.allowMultiCompany = null;
    },

    async setCompanies(companyIds) {
        // Get user restriction info if not loaded yet
        if (this.allowMultiCompany === null) {
            try {
                const userInfo = await this.orm.call(
                    "res.users",
                    "get_user_company_restriction",
                    []
                );
                this.allowMultiCompany = userInfo.allow_multi_company;
            } catch (error) {
                console.error("Error getting user company restriction:", error);
                this.allowMultiCompany = true; // Default to allowing if error
            }
        }

        // If user doesn't have multi-company permission
        if (!this.allowMultiCompany) {
            const currentCompanies = this.companyService.activeCompanyIds;
            
            // If trying to select more than one company
            if (companyIds.length > 1) {
                this.notification.add(
                    "You can only select one company at a time.",
                    {
                        type: "warning",
                        title: "Single Company Restriction",
                    }
                );
                return; // Prevent the change
            }
            
            // If trying to deselect all companies
            if (companyIds.length === 0) {
                this.notification.add(
                    "You must have at least one company selected.",
                    {
                        type: "warning",
                        title: "Company Required",
                    }
                );
                return; // Prevent the change
            }
        }

        // Proceed with normal behavior if allowed
        return super.setCompanies(...arguments);
    },
});
