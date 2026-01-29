/** @odoo-module **/

import { SwitchCompanyMenu } from "@web/webclient/switch_company_menu/switch_company_menu";
import { patch } from "@web/core/utils/patch";
import { useService } from "@web/core/utils/hooks";

patch(SwitchCompanyMenu.prototype, {
    setup() {
        super.setup();
        this.orm = useService("orm");
        this.notification = useService("notification");
    },

    async toggleCompany(companyId) {
        // Get user company restriction info
        const userInfo = await this.orm.call(
            "res.users",
            "get_user_company_restriction",
            []
        );

        const allowMultiCompany = userInfo.allow_multi_company;
        const currentCompanies = this.companyService.activeCompanyIds;

        // If user doesn't have multi-company permission
        if (!allowMultiCompany) {
            // Check if trying to add a second company
            if (!currentCompanies.includes(companyId) && currentCompanies.length >= 1) {
                this.notification.add(
                    "You can only select one company at a time. Please deselect the current company first.",
                    {
                        type: "warning",
                        title: "Single Company Restriction",
                    }
                );
                return;
            }
            
            // If trying to deselect the only company
            if (currentCompanies.includes(companyId) && currentCompanies.length === 1) {
                this.notification.add(
                    "You must have at least one company selected.",
                    {
                        type: "warning",
                        title: "Company Required",
                    }
                );
                return;
            }
        }

        // Proceed with normal toggle if allowed
        await super.toggleCompany(companyId);
    },
});
