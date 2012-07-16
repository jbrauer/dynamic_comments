<?php

/**
 * @file
 * Post handler file for Dynamic Comments.
 */

/**
 * Custom function
 */
function dynamic_comments_post_handler() {
  // Check token and return an access denied if it doesn't validate.
  if (!drupal_valid_token($_POST['token'])) {
    return drupal_access_denied();
  }

  // Validate if nid is numeric as an added security measure.
  if (!is_numeric($_POST['nid'])) {
    return drupal_access_denied();
  }

  // Get action from POST.
  switch (filter_xss($_POST['action'])) {
    case 'insert':
      $data = array(
        'nid' => $_POST['nid'],
        'comment_body' => $_POST['comment'],
        'range_position' => $_POST['range'],
        'uid' => $_POST['user'],
        'parent' => $_POST['parent'],
        'position' => $_POST['position'],
        'status' => $_POST['status'],
      );
      $result = drupal_write_record('dynamic_comments_comments', $data);

      if (!$result) {
        drupal_json_output(array(
          'severity' => 'error',
          'message' => t('Failed to save your comment.'),
        ));
      }
      else {
        drupal_json_output(array(
          'severity' => 'status',
          'message' => t('Your comment has been saved.'),
        ));
      }
      break;

    case 'retrieve':
      $json_return = array();

      $data = array(
        'nid' => filter_xss($_POST['nid']),
      );

      $result = db_query('SELECT c.nid, c.cid, c.comment_body, c.range_position, c.uid, c.parent, c.position, c.status
                          FROM {dynamic_comments_comments} c
                          WHERE c.nid = :c.nid', array(':c.nid' => $data['nid']));

      while ($comment = db_fetch_object($result)) {
        // TODO Convert "user_load" to "user_load_multiple" if "$comment->uid" is other than a uid.
        // To return a single user object, wrap "user_load_multiple" with "array_shift" or equivalent.
        // Example: array_shift(user_load_multiple(array(), $comment->uid))
        $user = user_load($comment->uid);

        // In case user pic isn't set, we provide a module default one.
        if ($user->picture == '') {
          $user->picture = drupal_get_path('module', 'dynamic_comments') . '/images/silhouette.gif';
        }

        $json_comment = drupal_json_encode(array(
          'nid' => filter_xss($comment->nid),
          'cid' => filter_xss($comment->cid),
          'comment' => check_plain($comment->comment_body),
          'range' => filter_xss($comment->range_position),
          'user' => filter_xss($comment->uid),
          'parent' => filter_xss($comment->parent),
          'position' => filter_xss($comment->position),
          'status' => filter_xss($comment->status),
          'user_picture' => filter_xss($user->picture),
          'user_name' => filter_xss($user->name),
        ));

        $json_return[$comment->cid] = $json_comment;
      }
      return drupal_json_output($json_return);

      break;

    case 'delete':
      global $user;

      /*
       * Just for kicks, let's check that the user being sent from the JS actually
       * is the current user performing this ;)
       */
      if (filter_xss($_POST['user']) == $user->uid) {
        // Also check if the permission has been granted.
        if (user_access('delete Dynamic Comments single comments')) {
          $data = array(
            'nid' => $_POST['nid'],
            'comment' => $_POST['comment'],
            'uid' => $_POST['user'],
            'parent' => $_POST['parent'],
          );

          // Cast to int to avoid errors.
          if ((int) $data['parent'] == 0) {
            // First run query on parents then on child comments.
            // TODO Please review the conversion of this statement to the D7 database API syntax.
            /* db_query('DELETE FROM {dynamic_comments_comments} WHERE cid = %d', $data['comment']) */
            $query_1 = db_delete('dynamic_comments_comments')
  ->condition('cid', $data['comment'])
  ->execute();
            // TODO Please review the conversion of this statement to the D7 database API syntax.
            /* db_query('DELETE FROM {dynamic_comments_comments} WHERE parent = %d', $data['comment']) */
            $query_2 = db_delete('dynamic_comments_comments')
  ->condition('parent', $data['comment'])
  ->execute();

            // Both queries have to come back as true to return a true result.
            if ($query_1 && $query_2) {
              $result = TRUE;
            }
          }

          // Not a parent comment, just erase.
          else {
            // TODO Please review the conversion of this statement to the D7 database API syntax.
            /* db_query('DELETE FROM {dynamic_comments_comments} WHERE cid = %d', $data['comment']) */
            $result = db_delete('dynamic_comments_comments')
  ->condition('cid', $data['comment'])
  ->execute();
          }


        }
      }

      if (!$result) {
        drupal_json_output(array(
          'status' => 'fail',
          'comment' => check_plain($data['comment']),
          'severity' => 'error',
          'message' => t('Failed to delete your comment.'),
        ));
      }
      else {
        drupal_json_output(array(
          'status' => 'ok',
          'comment' => check_plain($data['comment']),
          'severity' => 'warning',
          'message' => t('Your comment has been deleted.'),
        ));
      }
      break;

    case 'update':
      global $user;

      /*
       * Just for kicks, let's check that the user being sent from the JS actually
       * is the current user performing this ;)
       */
      if (filter_xss($_POST['user']) == $user->uid) {
        // Also check if the permission has been granted.
        if (user_access('resolve Dynamic Comments comments')) {
          $data = array(
            'nid' => $_POST['nid'],
            'comment' => $_POST['comment'],
            'uid' => $_POST['user'],
            'parent' => $_POST['parent'],
            'status' => $_POST['status'],
          );
          // TODO Please review the conversion of this statement to the D7 database API syntax.
          /* db_query('UPDATE {dynamic_comments_comments} SET status = %d WHERE cid = %d', $data['status'], $data['comment']) */
          $result = db_update('dynamic_comments_comments')
  ->fields(array(
    'status' => $data['status'],
  ))
  ->condition('cid', $data['comment'])
  ->execute();
        }
      }

      if (!$result) {
        drupal_json_output(array(
          'status' => 'fail',
          'comment' => check_plain($data['comment']),
          'severity' => 'error',
          'message' => t('Failed to resolve your comment.'),
        ));
      }
      else {
        drupal_json_output(array(
          'status' => 'ok',
          'comment' => check_plain($data['comment']),
          'severity' => 'status',
          'message' => t('Your comment has been resolved.'),
        ));
      }
      break;
  }
}
