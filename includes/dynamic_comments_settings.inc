<?php

/**
 * @file
 * Settings file for Dynamic Comments.
 */

/**
 * Form callback for admin section
 */
function dynamic_comments_settings() {
  // Check if libraries have been installed.
  $files_missing = array();
  $files_to_check = array(
    'rangy-core.js' => './sites/all/libraries/rangy/rangy-core.js',
    'rangy-serializer.js' => './sites/all/libraries/rangy/rangy-serializer.js',
    'rangy-cssclassapplier.js' => './sites/all/libraries/rangy/rangy-cssclassapplier.js',
    'jquery.scrollTo.js' => './sites/all/libraries/jquery.scrollTo/jquery.scrollTo.js',
  );

  foreach ($files_to_check as $file_name => $file_path) {
    if (!file_exists($file_path)) {
      $files_missing[$file_name] = $file_path;
    }
  }

  if (!empty($files_missing)) {
    $message = t('Dynamic Messages is missing some files. Please install:');
    $message .= '<ul>';

    foreach ($files_missing as $file_name => $file_path) {
      $message .= '<li>' . $file_name . ' in the path ' . $file_path . '</li>';
    }

    $message .= '</ul>';

    // Display an error message prompting admin to install the required libraries.
    drupal_set_message($message, 'error');
  }
  return drupal_get_form('dynamic_comments_settings_form');
}

/**
 * Implements hook_form().
 */
function dynamic_comments_settings_form() {
  // Get current types.
  $types = _dynamic_comments_get_types();

  $form['dynamic_comments_node_types'] = array(
    '#type' => 'checkboxes',
    '#title' => t('Nodes types that will display Dynamic Comments'),
    '#default_value' => variable_get('dynamic_comments_node_types', NULL),
    '#options' => $types,
    '#description' => t('Select what node types will display Dynamic Comments'),
  );
  $form['dynamic_comments_interval'] = array(
    '#type' => 'select',
    '#title' => t('Auto refresh interval'),
    '#default_value' => variable_get('dynamic_comments_interval', 30000),
    '#options' => array(
      '0' => t('No auto refresh'),
      '5000' => t('Refresh every 5 seconds'),
      '10000' => t('Refresh every 10 seconds'),
      '15000' => t('Refresh every 15 seconds'),
      '30000' => t('Refresh every 30 seconds'),
      '60000' => t('Refresh every 60 seconds'),
    ),
    '#description' => t('Select the interval for Dynamic Comments to query the database for new comments'),
  );
  $form['dynamic_comments_content_class'] = array(
    '#type' => 'textfield',
    '#title' => t('Content class'),
    '#default_value' => variable_get('dynamic_comments_content_class', '.node .content'),
    '#description' => t('Dynamic Comments uses the class ".content" for the JQuery selector. Enter another value in this textbox only if you\'d like to modify this. Please include the dot in the class name.'),
  );
  $form['dynamic_comments_user_reference_field'] = array(
    '#type' => 'textfield',
    '#title' => t('Limit reviewers per User Reference field'),
    '#default_value' => variable_get('dynamic_comments_user_reference_field', NULL),
    '#description' => t('If set, Dynamic Comments will look at a user reference field in the node to be reviewed and will limit the functionality to these specific users. Enter the machine name of the User Reference field to be used.'),
  );
  return system_settings_form($form);
}

/**
 * Custom function.
 * Return node types in this site (separated function just to keep this whole thing organized).
 */
function _dynamic_comments_get_types() {
  $types = node_get_types('names');

  return $types;
}
