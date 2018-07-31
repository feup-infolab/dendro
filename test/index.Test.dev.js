process.env.NODE_ENV = "test";

global.app_startup_time = new Date();

const path = require("path");
const rlequire = require("rlequire");

const Config = rlequire("dendro", "src/models/meta/config.js").Config;

// 30 min TIMEOUT!!!!
Config.testsTimeout = 1800000;

console.log("Running in test mode with Node Version " + process.version + " and the app directory is : " + rlequire.absPathInApp("dendro", "."));

global.Config = Config;

global.tests = {};
// BEGIN interaction tests

// /interactions/favorite_descriptor_from_quick_list_for_project
rlequire("dendro", "test/routes/interactions/favorite_descriptor_from_quick_list_for_project/routes.interactions.favoriteDescriptorFromQuickListForProject.Test.js");

// favorite_descriptor_from_manual_list_for_project
rlequire("dendro", "test/routes/interactions/favorite_descriptor_from_manual_list_for_project/routes.interactions.favoriteDescriptorFromManualListForProject.Test.js");

// favorite_descriptor_from_manual_list_for_user
rlequire("dendro", "test/routes/interactions/favorite_descriptor_from_manual_list_for_user/routes.interactions.favoriteDescriptorFromManualListForUser.Test.js");

// favorite_descriptor_from_quick_list_for_user
rlequire("dendro", "test/routes/interactions/favorite_descriptor_from_quick_list_for_user/routes.interactions.favoriteDescriptorFromQuickListForUser.Test.js");

// /interactions/hide_descriptor_from_quick_list_for_project
rlequire("dendro", "test/routes/interactions/hide_descriptor_from_quick_list_for_project/routes.interactions.hideDescriptorFromQuickListForProject.Test.js");

// /interactions/hide_descriptor_from_quick_list_for_user
rlequire("dendro", "test/routes/interactions/hide_descriptor_from_quick_list_for_user/routes.interactions.hideDescriptorFromQuickListForUser.Test.js");

// /interactions/unfavorite_descriptor_from_quick_list_for_user
rlequire("dendro", "test/routes/interactions/unfavorite_descriptor_from_quick_list_for_user/routes.interactions.unfavoriteDescriptorFromQuickListForUser.Test.js");

// /interactions/unfavorite_descriptor_from_quick_list_for_project
rlequire("dendro", "test/routes/interactions/unfavorite_descriptor_from_quick_list_for_project/routes.interactions.unfavoriteDescriptorFromQuickListForProject.Test.js");

// /interactions/unhide_descriptor_from_quick_list_for_project
rlequire("dendro", "test/routes/interactions/unhide_descriptor_from_quick_list_for_project/routes.interactions.unhideDescriptorFromQuickListForProject.Test.js");

// /interactions/unhide_descriptor_from_quick_list_for_user
rlequire("dendro", "test/routes/interactions/unhide_descriptor_from_quick_list_for_user/routes.interactions.unhideDescriptorFromQuickListForUser.Test.js");

rlequire("dendro", "test/routes/interactions/accept_descriptor_from_quick_list/routes.interactions.acceptDescriptorFromQuickList.Test.js");

rlequire("dendro", "test/routes/interactions/accept_descriptor_from_quick_list_while_it_was_a_project_favorite/routes.interactions.acceptDescriptorFromQuickListWhileItWasAProjectFavorite.Test.js");

rlequire("dendro", "test/routes/interactions/accept_descriptor_from_quick_list_while_it_was_a_user_favorite/routes.interactions.acceptDescriptorFromQuickListWhileItWasAUserFavorite.Test.js");

rlequire("dendro", "test/routes/interactions/accept_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite/routes.interactions.acceptDescriptorFromQuickListWhileItWasAUserAndProjectFavorite.Test.js");

rlequire("dendro", "test/routes/interactions/accept_descriptor_from_manual_list/routes.interactions.acceptDescriptorFromManualList.Test.js");

rlequire("dendro", "test/routes/interactions/accept_descriptor_from_manual_list_while_it_was_a_project_favorite/routes.interactions.acceptDescriptorFromManualListWhileItWasAProjectFavorite.Test.js");

// accept_descriptor_from_manual_list_while_it_was_a_user_favorite
rlequire("dendro", "test/routes/interactions/accept_descriptor_from_manual_list_while_it_was_a_user_favorite/routes.interactions.acceptDescriptorFromManualListWhileItWasAUserFavorite.Test.js");

// accept_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite
rlequire("dendro", "test/routes/interactions/accept_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite/routes.interactions.acceptDescriptorFromManualListWhileItWasAUserAndProjectFavorite.Test.js");

// /interactions/accept_descriptor_from_autocomplete
rlequire("dendro", "test/routes/interactions/accept_descriptor_from_autocomplete/routes.interactions.acceptDescriptorFromAutocomplete.Test.js");

// /interactions/select_descriptor_from_manual_list
rlequire("dendro", "test/routes/interactions/select_descriptor_from_manual_list/routes.interactions.selectDescriptorFromManualList.Test.js");

// /interactions/accept_smart_descriptor_in_metadata_editor
rlequire("dendro", "test/routes/interactions/accept_smart_descriptor_in_metadata_editor/routes.interactions.acceptSmartDescriptorInMetadataEditor.Test.js");

// /interactions/accept_favorite_descriptor_in_metadata_editor
rlequire("dendro", "test/routes/interactions/accept_favorite_descriptor_in_metadata_editor/routes.interactions.acceptFavoriteDescriptorInMetadataEditor.Test.js");

// /interactions/delete_descriptor_in_metadata_editor
rlequire("dendro", "test/routes/interactions/delete_descriptor_in_metadata_editor/routes.interactions.deleteDescriptorInMetadataEditor.Test.js");

// /interactions/fill_in_descriptor_from_manual_list_in_metadata_editor
rlequire("dendro", "test/routes/interactions/fill_in_descriptor_from_manual_list_in_metadata_editor/routes.interactions.fillInDescriptorFromManualListInMetadataEditor.Test.js");

// /interactions/fill_in_descriptor_from_manual_list_while_it_was_a_project_favorite
rlequire("dendro", "test/routes/interactions/fill_in_descriptor_from_manual_list_while_it_was_a_project_favorite/routes.interactions.fillInDescriptorFromManualListWhileItWasAProjectFavorite.Test.js");

// /interactions/fill_in_descriptor_from_manual_list_while_it_was_a_user_favorite
rlequire("dendro", "test/routes/interactions/fill_in_descriptor_from_manual_list_while_it_was_a_user_favorite/routes.interactions.fillInDescriptorFromManualListWhileItWasAUserFavorite.Test.js");

// /interactions/fill_in_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite
rlequire("dendro", "test/routes/interactions/fill_in_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite/routes.interactions.fillInDescriptorFromManualListWhileItWasAUserAndProjectFavorite.Test.js");

// /interactions/fill_in_descriptor_from_quick_list_in_metadata_editor
rlequire("dendro", "test/routes/interactions/fill_in_descriptor_from_quick_list_in_metadata_editor/routes.interactions.fillInDescriptorFromQuickListInMetadataEditor.Test.js");

// /interactions/fill_in_descriptor_from_quick_list_while_it_was_a_project_favorite
rlequire("dendro", "test/routes/interactions/fill_in_descriptor_from_quick_list_while_it_was_a_project_favorite/routes.interactions.fillInDescriptorFromQuickListWhileItWasAProjectFavorite.Test.js");

// /interactions/fill_in_descriptor_from_quick_list_while_it_was_a_user_favorite
rlequire("dendro", "test/routes/interactions/fill_in_descriptor_from_quick_list_while_it_was_a_user_favorite/routes.interactions.fillInDescriptorFromQuickListWhileItWasAUserFavorite.Test.js");

// /interactions/fill_in_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite
rlequire("dendro", "test/routes/interactions/fill_in_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite/routes.interactions.fillInDescriptorFromQuickListWhileItWasAUserAndProjectFavorite.Test.js");

// /interactions/fill_in_inherited_descriptor
rlequire("dendro", "test/routes/interactions/fill_in_inherited_descriptor/routes.interactions.fillInInheritedDescriptor.Test.js");

// /interactions/delete_all
rlequire("dendro", "test/routes/interactions/delete_all/routes.interactions.deleteAll.Test.js");
// END interaction tests